/* eslint global-require:off, import/no-dynamic-require:off, no-restricted-properties:off */

/**
 * @overview util
 *
 * @description
 * This module contains useful utility functions used throughout the server.
 *
 * @requires lodash
 * @requires path
 * @requires moment
 * @requires debug
 * @requires csvtojson
 * @requires fs
 * @requires crypto
 */

const path = require('path');
const moment = require('moment');
const debug = require('debug')('util');
const csvtojson = require('csvtojson');
const fs = require('fs');

const { randomUUID } = require('node:crypto');

exports.take = take;
exports.loadModuleIfExists = requireModuleIfExists;
exports.format = require('util').format;

exports.isDate = isDate;
exports.isString = isString;
exports.calculateAge = calculateAge;
exports.renameKeys = renameKeys;

exports.roundDecimal = roundDecimal;
exports.loadDictionary = loadDictionary;
exports.stringToNumber = stringToNumber;
exports.convertStringToNumber = convertStringToNumber;
exports.formatCsvToJson = formatCsvToJson;
exports.createDirectory = createDirectory;

exports.median = median;
exports.convertToNumericArray = convertToNumericArray;

/**
 * @function take
 *
 * @description
 * Creates a filter to be passed to a Array.map() function.  This filter will
 * flatten an array of JSONs in to an array of arrays with values matching the
 * keys specified as arguments, in the order that they are specified.
 *
 * @returns {Function} filter - a filtering function to that will convert an
 *   object to an array with the given keys.
 *
 * @example
 * var _ = require('lodash');
 *
 * var array = [{
 *   id: 1,
 *   season: 'summer',
 * }, {
 *   id : 2,
 *   season : 'winter'
 * }, {
 *   id : 3,
 *   season : 'fall'
 * }];
 *
 * // take the ids from the JSON array
 * var filter = take('id');
 * var ids = _.flatMap(array, filter); // returns [1, 2, 3];
 * var ids = _.map(array, filter); // returns [ [1], [2], [3]];
 *
 * // take both the id and the season properties from the array
 * var filter = take('id', 'season');
 * var arrs = _.map(array, filter); // returns [[1, 'summer], [2, 'winter'], [3, 'fall']]
 */
function take(...keys) {
  // get the arguments as an array
  // return the filter function
  return object => (keys.map(key => object[key]));
}

/**
 * @method requireModuleIfExists
 * @description load a module if it exists
 */
function requireModuleIfExists(moduleName) {
  try {
    require(moduleName);
    debug(`Dynamically loaded ${moduleName}.`);
  } catch (err) {
    return false;
  }
  return true;
}

/**
 * @method isDate
 *
 * @description
 * Checks if the value is a JS date.
 */
function isDate(value) {
  return Object.prototype.toString.call(value) === '[object Date]';
}

/**
 * @function roundDecimal
 *
 * @description
 * Round a decimal to a certain precision.
 *
 * @param {Number} number
 * @param {Number} precision
 */
function roundDecimal(number, precision = 4) {
  const base = 10 ** precision;
  return Math.round(number * base) / base;
}

/**
 * @function loadDictionary
 *
 * @description
 * Either returns a cached version of the dictionary, or loads the dictionary
 * into the cache and returns it.
 *
 * @param {String} key - either 'fr' or 'en'
 */
function loadDictionary(key, dictionaries = {}) {
  const dictionary = dictionaries[key];
  if (dictionary) { return dictionary; }

  dictionaries[key] = require(`../../client/i18n/${key}.json`);
  return dictionaries[key];
}

/**
 * @function stringToNumber
 *
 * @description
 * convert string number to number
 *
 * @param {string} x
 */
function stringToNumber(x) {
  const parsed = Number(x);
  if (Number.isNaN(parsed)) { return x; }
  return parsed;
}

/**
 * @function convertStringToNumber
 *
 * @description
 * look into an object and convert each string number to number if it is possible
 *
 * @param {object} obj An object in which we want to convert value of each property into the correct type
 */
function convertStringToNumber(obj) {
  Object.keys(obj).forEach(property => {
    obj[property] = stringToNumber(obj[property]);
  });
  return obj;
}

/**
 * @function isString
 *
 * @description
 * Helper method to determine if a value is a string.
 */
function isString(value) {
  return typeof value === 'string';
}

/**
 * @function renameKeys
 *
 * @description
 * Rename an object's keys.
 */
function renameKeys(objs, newKeys) {
  const formatedKeys = isString(newKeys) ? JSON.parse(newKeys) : newKeys;

  // if an array of objects, rename each object
  if (Array.isArray(objs)) {
    return objs.map(o => renameObjectKeys(o, formatedKeys));
  }
  return renameObjectKeys(objs, formatedKeys);
}

function renameObjectKeys(obj, newKeys) {
  const keyValues = Object.keys(obj).map(key => {
    const newKey = newKeys[key] || key;
    return { [newKey] : obj[key] };
  });

  return Object.assign({}, ...keyValues);
}

/**
 * @function formatCsvToJson
 *
 * @description
 * Converts a csv file to a json
 *
 * @param {String} filePath - the path to the CSV file on distk
 *
 * @return {Promise} return a promise
 */
async function formatCsvToJson(filePath) {
  const rows = await csvtojson()
    .fromFile(path.resolve(filePath));

  return rows;
}

// calculate an age from a year
function calculateAge(dob) {
  return moment().diff(dob, 'years');
}

function createDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive : true });
}

/**
 * @function median
 *
 * @description
 * Returns the median of the values in an array.
 * The median off an array is the middle value of the
 * sorted array (or average of the two values bracketing
 * the middle of an array with an even number of entries).
 *
 * If the array is empty, return null!
 *
 * @param {Array} arrayIn - the array of values (not changed)
 *
 * @return {number} returns the median value of the array
 */
function median(arrayIn) {
  if (!arrayIn.length) return null;
  // Sort the array numerically using a comparator function.
  // By default, JavaScript's sort() method sorts elements as strings,
  // which can lead to incorrect results for numeric arrays.
  // The comparator (a, b) => a - b ensures proper numeric sorting.
  const array = [...arrayIn].sort((a, b) => a - b);
  const len = array.length;
  const mid = Math.floor(len / 2);
  return len % 2
    ? array[mid]
    : (array[mid - 1] + array[mid]) / 2;
}

/**
 * @function uuid
 *
 * @description
 * A replacement for the uuid function that renders UUIDs in the same format
 * as the BUID() MySQL function.
 *
 * @returns {String} - a version 4 UUID
 */
exports.uuid = () => randomUUID().toUpperCase().replace(/-/g, '');

/**
 * @function getPeriodIdForDate
 *
 * @description
 * This function gets the BHIMA formated period given a date object and
 * returns it.  Since periods can be zero-prefixed, it is a string.
 *
 * @returns {String} the period_id
 */
exports.getPeriodIdForDate = (date) => {
  const month = date.getMonth() + 1;
  const monthStr = month.toString().length === 1
    ? `0${month}` : `${month}`;

  return `${date.getFullYear()}${monthStr}`;
};

/**
 * @function convertToNumericArray
 *
 * @description
 * Converts a given input into an array of numbers.
 * - If the input is falsy (e.g., null, undefined, ''), returns an empty array.
 * - If the input is already an array, it converts each element to a number.
 * - If the input is a single value, it converts it to a number and wraps it in an array.
 *
 * @param {*} param - The value or array of values to convert.
 * @returns {number[]} An array of numbers.
 */
function convertToNumericArray(param) {
  if (!param) return [];
  return Array.isArray(param) ? param.map(Number) : [Number(param)];
}
