/**
 * memory-bank.js
 * A simple module to store and retrieve data
 */

const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'data');
const defaultStoragePath = path.join(dataDir, 'memory-storage.json');

class MemoryBank {
  constructor(storagePath = defaultStoragePath) {
    this.storagePath = storagePath;
    this.data = {};
    this.initialize();
  }

  initialize() {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      if (fs.existsSync(this.storagePath)) {
        const rawData = fs.readFileSync(this.storagePath, 'utf8');
        this.data = JSON.parse(rawData);
        console.log('Memory bank loaded successfully');
      } else {
        // Create empty storage file if it doesn't exist
        this.save();
        console.log('New memory bank initialized');
      }
    } catch (error) {
      console.error('Error initializing memory bank:', error);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(this.data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving memory bank:', error);
      return false;
    }
  }

  // Store a value with a key
  store(key, value) {
    this.data[key] = value;
    return this.save();
  }

  // Retrieve a value by key
  retrieve(key) {
    return this.data[key];
  }

  // Check if a key exists
  has(key) {
    return key in this.data;
  }

  // Delete a key
  delete(key) {
    if (this.has(key)) {
      delete this.data[key];
      return this.save();
    }
    return false;
  }

  // Get all keys
  keys() {
    return Object.keys(this.data);
  }

  // Clear all data
  clear() {
    this.data = {};
    return this.save();
  }
}

module.exports = MemoryBank;
