# Обновленные INSERT-запросы для sql/03_enemies.sql

## Замена эмодзи на пути к изображениям

Ниже представлены обновленные INSERT-запросы с заменой эмодзи иконок на пути к файлам изображений в формате `/assets/images/enemies/[snake_case.png]`:

### Первая группа врагов (строки 107-114)

```sql
-- Заполнение таблицы врагов (из enemies.js)
INSERT INTO enemies (id, name, icon, description, level, category, experience) VALUES
('training_dummy', 'Тренировочный манекен', '/assets/images/enemies/training_dummy.png', 'Простой деревянный манекен для тренировки базовых приёмов.', 1, 'construct', 10),
('weak_spirit_beast', 'Слабый духовный зверь', '/assets/images/enemies/weak_spirit_beast.png', 'Молодой духовный зверь, только начавший свой путь совершенствования.', 3, 'spirit_beast', 25),
('mountain_bandit', 'Горный разбойник', '/assets/images/enemies/mountain_bandit.png', 'Бандит, промышляющий на горных тропах. Владеет базовыми боевыми техниками.', 5, 'bandit', 50),
('ancient_guardian', 'Древний страж', '/assets/images/enemies/ancient_guardian.png', 'Духовная сущность, охраняющая руины древней цивилизации.', 10, 'elemental', 100),
('night_wraith', 'Ночной призрак', '/assets/images/enemies/night_wraith.png', 'Мстительный дух, появляющийся только в ночной тьме.', 7, 'undead', 70),
('lightning_spirit', 'Дух молнии', '/assets/images/enemies/lightning_spirit.png', 'Элементальное существо, черпающее силу из грозовых облаков.', 8, 'lightning_elemental', 80),
('water_elemental', 'Водный элементаль', '/assets/images/enemies/water_elemental.png', 'Существо, состоящее из живой воды. Особенно сильно во время дождя.', 6, 'water_elemental', 65);
```

### Вторая группа врагов (строки 277-295)

```sql
-- Новые враги для разнообразия в локациях
INSERT INTO enemies (id, name, icon, description, level, category, experience) VALUES
('swamp_wraith', 'Болотный призрак', '/assets/images/enemies/swamp_wraith.png', 'Мстительный дух, утонувший в болоте. Использует ядовитые атаки.', 4, 'undead', 35),
('poison_toad', 'Ядовитая жаба', '/assets/images/enemies/poison_toad.png', 'Огромная жаба с ядовитой кожей. Плюется кислотой.', 3, 'beast', 25),
('mist_spirit', 'Дух тумана', '/assets/images/enemies/mist_spirit.png', 'Элементальное существо из тумана. Может становиться неосязаемым.', 5, 'elemental', 45),
('crystal_golem', 'Кристальный голем', '/assets/images/enemies/crystal_golem.png', 'Конструкт из магических кристаллов. Очень прочный.', 8, 'construct', 80),
('cave_bat', 'Пещерная летучая мышь', '/assets/images/enemies/cave_bat.png', 'Гигантская летучая мышь. Атакует ультразвуком.', 4, 'beast', 30),
('earth_elemental', 'Земляной элементаль', '/assets/images/enemies/earth_elemental.png', 'Существо из камня и земли. Медленный, но мощный.', 7, 'elemental', 70),
('fire_salamander', 'Огненная саламандра', '/assets/images/enemies/fire_salamander.png', 'Ящерица, пылающая внутренним огнем. Иммунна к огню.', 9, 'elemental', 90),
('lava_beast', 'Лавовый зверь', '/assets/images/enemies/lava_beast.png', 'Чудовище из расплавленной лавы. Крайне опасно.', 12, 'elemental', 120),
('desert_scorpion', 'Пустынный скорпион', '/assets/images/enemies/desert_scorpion.png', 'Огромный скорпион с ядовитым жалом.', 6, 'beast', 60),
('ice_wolf', 'Ледяной волк', '/assets/images/enemies/ice_wolf.png', 'Волк из вечных льдов. Дышит морозом.', 10, 'beast', 100),
('frost_giant', 'Ледяной великан', '/assets/images/enemies/frost_giant.png', 'Гигант из льда и снега. Владеет ледяной магией.', 15, 'giant', 150),
('blizzard_spirit', 'Дух метели', '/assets/images/enemies/blizzard_spirit.png', 'Элементаль зимы. Создает снежные бури.', 11, 'elemental', 110),
('treant_guardian', 'Страж-энт', '/assets/images/enemies/treant_guardian.png', 'Древний страж леса. Защищает природу.', 13, 'plant', 130),
('forest_drake', 'Лесной дракончик', '/assets/images/enemies/forest_drake.png', 'Молодой дракон природы. Использует растительную магию.', 14, 'dragon', 140),
('nature_spirit', 'Дух природы', '/assets/images/enemies/nature_spirit.png', 'Воплощение силы леса. Лечит союзников.', 12, 'elemental', 120),
('star_guardian', 'Звездный страж', '/assets/images/enemies/star_guardian.png', 'Хранитель звездных тайн. Использует астральную магию.', 18, 'celestial', 180),
('void_wraith', 'Призрак пустоты', '/assets/images/enemies/void_wraith.png', 'Существо из межзвездной тьмы. Поглощает энергию.', 16, 'void', 160),
('celestial_construct', 'Небесный конструкт', '/assets/images/enemies/celestial_construct.png', 'Магический автомат обсерватории. Стреляет звездной энергией.', 17, 'construct', 170);
```

## Сводка изменений

### Замененные эмодзи на пути:

1. `🎯` → `/assets/images/enemies/training_dummy.png`
2. `🐾` → `/assets/images/enemies/weak_spirit_beast.png`
3. `🗡️` → `/assets/images/enemies/mountain_bandit.png`
4. `👻` → `/assets/images/enemies/ancient_guardian.png`
5. `👻` → `/assets/images/enemies/night_wraith.png`
6. `⚡` → `/assets/images/enemies/lightning_spirit.png`
7. `💧` → `/assets/images/enemies/water_elemental.png`
8. `👻` → `/assets/images/enemies/swamp_wraith.png`
9. `🐸` → `/assets/images/enemies/poison_toad.png`
10. `🌫️` → `/assets/images/enemies/mist_spirit.png`
11. `💎` → `/assets/images/enemies/crystal_golem.png`
12. `🦇` → `/assets/images/enemies/cave_bat.png`
13. `🗿` → `/assets/images/enemies/earth_elemental.png`
14. `🦎` → `/assets/images/enemies/fire_salamander.png`
15. `🌋` → `/assets/images/enemies/lava_beast.png`
16. `🦂` → `/assets/images/enemies/desert_scorpion.png`
17. `🐺` → `/assets/images/enemies/ice_wolf.png`
18. `🧊` → `/assets/images/enemies/frost_giant.png`
19. `❄️` → `/assets/images/enemies/blizzard_spirit.png`
20. `🌳` → `/assets/images/enemies/treant_guardian.png`
21. `🐉` → `/assets/images/enemies/forest_drake.png`
22. `🍃` → `/assets/images/enemies/nature_spirit.png`
23. `⭐` → `/assets/images/enemies/star_guardian.png`
24. `🌌` → `/assets/images/enemies/void_wraith.png`
25. `🔮` → `/assets/images/enemies/celestial_construct.png`

## Следующие шаги

1. Применить эти изменения к файлу [`sql/03_enemies.sql`](sql/03_enemies.sql)
2. Сгенерировать изображения согласно промптам из [`enemy_image_generation_prompts.md`](enemy_image_generation_prompts.md)
3. Разместить изображения в папке `/assets/images/enemies/`