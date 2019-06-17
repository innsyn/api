/* Copyright 2019 Schibsted */

module.exports = { dateFormatYYYMMDDhhmm, getDateFromString };

function dateFormatYYYMMDDhhmm(date, locale) {
  if (locale) {
    return getLocalePadded(date, locale);
  }
  return getUTCPadded(date);
}

function getUTCPadded(date) {
  let year = date.getUTCFullYear();
  let monthPadded = padNumber(date.getUTCMonth() + 1, 2);
  let dayPadded = padNumber(date.getUTCDate(), 2);
  let hourPadded = padNumber(date.getUTCHours(), 2);
  let minutePadded = padNumber(date.getUTCMinutes(), 2);

  return `${year}-${monthPadded}-${dayPadded}T${hourPadded}:${minutePadded}`;
}

function getLocalePadded(date, locale) {
  let dateString = date.toLocaleString('en-GB', {
    timeZone: locale,
    hour12: false,
  });
  [day, month, year, hour, minute] = dateString.split(/[\/|,|:]/);

  let dayPadded = padNumber(day, 2);
  let monthPadded = padNumber(month, 2);
  let hourPadded = padNumber(hour, 2);
  let minutePadded = padNumber(minute, 2);

  let dateFormatted = `${year}-${monthPadded}-${dayPadded}T${hourPadded}:${minutePadded}`;
  return dateFormatted;
}

function padNumber(number, size) {
  let n = parseInt(number);
  let s = String(n);
  while (s.length < (size || 2)) {
    s = '0' + s;
  }
  return s;
}

/***
 * Converts a string into a date if possible. Will return an empty string if not.
 * @param dateString A date string with year, month and date parts. The string must have either
 * a dot or hyphen separator.
 * @param expectedDatePartOrder A combination of the letters Y (year), M (month) and D (date). Not a format string,
 * just ordering of the date parts. Examples: YMD and DMY.
 */
function getDateFromString(dateString, expectedDatePartOrder) {
  let separator = dateString.indexOf('.')
    ? '.'
    : dateString.indexOf('-')
    ? '-'
    : '';
  if (separator === '')
    throw new Error(
      "Can't format date string. Date string must contain either . or - as separators",
    );

  if (expectedDatePartOrder.length !== 3)
    throw new Error(
      'Expected date part order parameter must contain three characters.',
    );

  const dateParts = dateString.split(separator);

  if (dateParts.length !== 3)
    throw new Error(
      'Only dates with three components supported (year, month, day)',
    );

  let year, month, day;

  for (let i = 0; i < dateParts.length; i++) {
    if (expectedDatePartOrder[i].toLowerCase().startsWith('y')) {
      year = dateParts[i];
    }
    if (expectedDatePartOrder[i].toLowerCase().startsWith('m')) {
      month = dateParts[i];
    }
    if (expectedDatePartOrder[i].toLowerCase().startsWith('d')) {
      day = dateParts[i];
    }
  }

  let result = new Date('"' + year + '/' + month + '/' + day + '"');
  if (result === 'Invalid Date') {
    return '';
  }
  return result;
}
