angular.module('bhima.components')
  .component('bhStrengthMeter', {
    template : `
      <div class="strength-meter" ng-if="$ctrl.showStrengthMeter">
        <div class="strength-meter-fill" data-strength="{{$ctrl.strength}}"></div>
      </div>`,
    bindings : {
      password : '<',
    },
    controller : StrengthMeterController,
  });

StrengthMeterController.$inject = [
  'PasswordMeterService', 'SessionService',
];

/**
 * @param PasswordMeterService
 * @param Session
 * @function StrengthMeterController
 * @description
 * This is a display only component that evaluates a password's strength as the
 * user types it.  It displays these values in a meter underneath the password
 * input.
 */
function StrengthMeterController(PasswordMeterService, Session) {
  const settings = Session.enterprise && Session.enterprise.settings;

  // show the meter unless an enterprise is loaded AND has explicitly disabled it
  this.showStrengthMeter = !settings || settings.enable_password_validation;

  this.strength = 0;

  this.$onChanges = (changes) => {
    if (changes.password) {
      this.strength = PasswordMeterService.counter(this.password);
    }
  };
}
