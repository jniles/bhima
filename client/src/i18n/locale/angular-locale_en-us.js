angular.module('ngLocale', [], ['$provide', function provider($provide) {
  const PLURAL_CATEGORY = {
    ZERO : 'zero', ONE : 'one', TWO : 'two', FEW : 'few', MANY : 'many', OTHER : 'other',
  };
  function getDecimals(n) {
    const n2 = `${n}`;
    const i = n2.indexOf('.');
    return (i === -1) ? 0 : n2.length - i - 1;
  }

  function getVF(n, optPrecision) {
    let v = optPrecision;

    if (undefined === v) {
      v = Math.min(getDecimals(n), 3);
    }

    const base = 10 ** v;
    const f = ((n * base) | 0) % base; // eslint-disable-line
    return { v, f };
  }

  $provide.value('$locale', {
    DATETIME_FORMATS : {
      AMPMS : [
        'AM',
        'PM',
      ],
      DAY : [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      ERANAMES : [
        'Before Christ',
        'Anno Domini',
      ],
      ERAS : [
        'BC',
        'AD',
      ],
      FIRSTDAYOFWEEK : 6,
      MONTH : [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      SHORTDAY : [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
      ],
      SHORTMONTH : [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      STANDALONEMONTH : [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      WEEKENDRANGE : [
        5,
        6,
      ],
      fullDate : 'EEEE, MMMM d, y',
      longDate : 'MMMM d, y',
      medium : 'MMM d, y h:mm:ss a',
      mediumDate : 'MMM d, y',
      mediumTime : 'h:mm:ss a',
      short : 'M/d/yy h:mm a',
      shortDate : 'M/d/yy',
      shortTime : 'h:mm a',
    },
    NUMBER_FORMATS : {
      CURRENCY_SYM : '$',
      DECIMAL_SEP : '.',
      GROUP_SEP : ',',
      PATTERNS : [
        {
          gSize : 3,
          lgSize : 3,
          maxFrac : 3,
          minFrac : 0,
          minInt : 1,
          negPre : '-',
          negSuf : '',
          posPre : '',
          posSuf : '',
        },
        {
          gSize : 3,
          lgSize : 3,
          maxFrac : 2,
          minFrac : 2,
          minInt : 1,
          negPre : '-\u00a4',
          negSuf : '',
          posPre : '\u00a4',
          posSuf : '',
        },
      ],
    },
    id : 'en-us',
    localeID : 'en_US',
    // eslint-disable-next-line
    pluralCat(n, opt_precision) { const i = n | 0; const vf = getVF(n, opt_precision); if (i == 1 && vf.v == 0) { return PLURAL_CATEGORY.ONE; } return PLURAL_CATEGORY.OTHER; },
  });
}]);
