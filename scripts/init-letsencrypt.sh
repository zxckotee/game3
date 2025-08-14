#!/bin/bash

# Скрипт для инициализации Let's Encrypt сертификатов для culty.ru
# Этот скрипт должен быть запущен ОДИН РАЗ при первом развертывании

set -e

domains=(culty.ru www.culty.ru)
rsa_key_size=4096
data_path="./ssl/certbot"
email="admin@culty.ru" # Замените на ваш email
staging=0 # Установите в 1 для тестирования

echo "### Инициализация Let's Encrypt для culty.ru ###"

if [ -d "$data_path" ]; then
  read -p "Существующие данные найдены для $domains. Продолжить и заменить существующий сертификат? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Загрузка рекомендуемых TLS параметров ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

echo "### Создание фиктивного сертификата для $domains ..."
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### Запуск nginx ..."
docker-compose -f docker-compose.prod.yml up --force-recreate -d nginx
echo

echo "### Удаление фиктивного сертификата для $domains ..."
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo

echo "### Запрос Let's Encrypt сертификата для $domains ..."
#Join $domains to -d args
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Выбираем подходящий email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Включаем staging режим если нужно
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Создание Diffie-Hellman параметров ..."
mkdir -p ./ssl/dhparam
if [ ! -f "./ssl/dhparam/dhparam.pem" ]; then
  openssl dhparam -out ./ssl/dhparam/dhparam.pem 2048
fi

echo "### Перезагрузка nginx ..."
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "### Готово! Сертификаты установлены для culty.ru ###"
echo "### Не забудьте настроить автоматическое обновление! ###"