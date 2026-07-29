/**
 * @name bhDateInterval
 * @description
 * The `bhDateInterval` component provide a means to select a date range
 * between two dates. The dates values returned are sent to dates models
 * given in date-from and date-to attributes.
 *
 * An optional flag `limit-min-fiscal` can be provided that limits the from and
 * to date inputs to not allow dates before the start of the first enterprise
 * fiscal year.
 * @example
 * ```html
 * <bh-date-interval date-from="$MyCtrl.dateFrom" date-to="$MyCtrl.dateTo">
 * </bh-date-interval>
 * ```
 */
angular.module('bhima.components')
  .component('bhDateInterval', {
    templateUrl : '/modules/templates/bhDateInterval.tmpl.html',
    controller : bhDateInterval,
    bindings : {
      dateFrom : '=', // date from
      dateTo : '=', // date to
      dateId : '@?', // date identifier
      required : '<?', // true or false
      onChange : '&?', // on change action
      canClear : '<?', // flag for displaying clear button
      label : '@?',
      mode : '@?', // the date mode (day|month|year)
      startDatePlaceholder : '@?',
      endDatePlaceholder : '@?',
      limitMinFiscal : '@?', // do not allow the minimum date to be before the first fiscal year
    },
  });

// dependencies injection
bhDateInterval.$inject = [
  'bhConstants', 'FiscalService', 'NotifyService',
  'SessionService', 'PeriodService', '$translate',
];

// controller definition
/**
 *
 * @param bhConstants
 * @param Fiscal
 * @param Notify
 * @param Session
 * @param PeriodService
 * @param $translate
 */
function bhDateInterval(bhConstants, Fiscal, Notify, Session, PeriodService, $translate) {
  const $ctrl = this;

  // FIXME(@jniles) - this should be an API
  PeriodService.dateFormat = 'YYYY-MM-DD';

  // expose to the view
  $ctrl.search = search;
  $ctrl.clear = clear;
  $ctrl.lastDateFrom = null;
  $ctrl.lastDateTo = null;

  $ctrl.$onInit = () => {

    $ctrl.options = [
      { translateKey : 'FORM.LABELS.TODAY', range :'day' },
      { translateKey : 'FORM.LABELS.THIS_WEEK', range: 'week' },
      { translateKey : 'FORM.LABELS.THIS_MONTH', range: 'month' },
      { translateKey : 'FORM.LABELS.THIS_YEAR', rangef: 'year' },
    ];

    Object.assign($ctrl, {
      label : $ctrl.label || 'FORM.SELECT.DATE_INTERVAL',
      canClear : $ctrl.canClear ?? true,
      dateRangeError : false,
    });


    $ctrl.dateFormat = bhConstants.dayOptions.format;
    $ctrl.pickerFromOptions = { showWeeks : false };
    $ctrl.pickerToOptions = { showWeeks : false, minDate : $ctrl.dateFrom };
    $ctrl.startDatePlaceholder = $translate.instant($ctrl.startDatePlaceholder || 'FORM.LABELS.START_DATE');
    $ctrl.endDatePlaceholder = $translate.instant($ctrl.endDatePlaceholder || 'FORM.LABELS.END_DATE');

    // if controller has requested limit-min-fiscal, fetch required information
    if ($ctrl.limitMinFiscal !== undefined) {
      getMinimumFiscalYearDate();
    }

    startup();
  };

  /**
   *
   */
  function getMinimumFiscalYearDate() {
    Fiscal.getEnterpriseFiscalStartDate(Session.enterprise.id)
      .then(response => {
        $ctrl.pickerFromOptions.minDate = new Date(response.start_date);
      });
  }

  $ctrl.onChangeDate = () => {
    $ctrl.pickerToOptions.minDate = $ctrl.dateFrom;

    // Make sure dateTo >= dateFrom
    if ($ctrl.dateFrom && $ctrl.dateTo) {
      if ($ctrl.dateTo < $ctrl.dateFrom) {
        Notify.danger('ERRORS.ER_DATE_RANGE', 8000);
        $ctrl.dateTo = null;
        $ctrl.dateRangeError = true;
        return;
      }
      $ctrl.dateRangeError = false;
    }

    if ($ctrl.onChange) {
      $ctrl.onChange({ dateFrom : $ctrl.dateFrom, dateTo : $ctrl.dateTo });
    }

    if ($ctrl.dateFrom !== $ctrl.lastDateFrom || $ctrl.dateTo !== $ctrl.lastDateTo) {
      delete $ctrl.selected;
      $ctrl.lastDateFrom = $ctrl.dateFrom;
      $ctrl.lastDateTo = $ctrl.dateTo;
    }
  };


  const DATE_RANGES = Object.freeze({
    day : 'today',
    week : 'week',
    month : 'month',
    year : 'year',
  });


  /**
   * @param selection
   */
  function search(selection) {
      $ctrl.selected = selection.translateKey;
      setDateInterval(DATE_RANGES[selection.range]);
      $ctrl.onChangeDate();
  }


  /**
   * @param key
   */
  function setDateInterval(key) {
    $ctrl.dateFrom = new Date(PeriodService.index[key].limit.start());
    $ctrl.dateTo = new Date(PeriodService.index[key].limit.end());
    $ctrl.lastDateFrom = $ctrl.dateFrom;
    $ctrl.lastDateTo = $ctrl.dateTo;
  }

  /**
   *
   */
  function custom() {
    if ($ctrl.dateFrom) {
      $ctrl.dateFrom = new Date($ctrl.dateFrom);
    }

    if ($ctrl.dateTo) {
      $ctrl.dateTo = new Date($ctrl.dateTo);
    }
  }

  /**
   *
   */
  function clear() {
    delete $ctrl.dateFrom;
    delete $ctrl.dateTo;
    delete $ctrl.selected;
    $ctrl.lastDateFrom = null;
    $ctrl.lastDateTo = null;
  }

  /**
   *
   */
  function startup() {
    const option = $ctrl.options.find(o => o.range === $ctrl.mode);

    if (option) {
      search(option);
      $ctrl.pickerFromOptions.mode = $ctrl.mode;
    } else {
      custom();
    }
    // set clean mode
    if ($ctrl.mode === 'clean') {
      clear();
    }
  }
}
