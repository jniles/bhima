angular.module('bhima.services')
  .service('StockExitItemService', StockExitItemService);

StockExitItemService.$inject = ['uuid'];

/**
 * @class StockExitItemServuce
 *
 * @description
 *
 */
function StockExitItemService(UUID) {

  /**
   * @constructor StockExitItem
   */
  function StockExitItem() {
    // generate a UUID for this item
    this.uuid = UUID();

    this.inventory_uuid = null;
    this.lot_uuid = null;
    this.code = null;
    this.label = null;
    this.text = '';
    this.quantity = 0;
    this.unit_cost = 0;
    this.expiration_date = new Date();

    // TODO(@jniles) - add ability to skip items that do not have expiration
    // dates.
    this._hasExpirationDate = true;

    // add custom properties for validation and tracking.
    this._isValid = false;
    this._initialised = false;
    this._errors = [];

    // default to comparing today
    this._comparisonDate = new Date();

    // run validation on create
    this.validate();
  }

  /**
   * @function setComparisonExpirationDate
   *
   * @description
   * Sets the comparison expiration date that the validate() function uses to
   * check if the item is expired or not.  This function serves two roles:
   *   1) Cleans up the client controller so that it isn't passing dates around everywhere.
   *   2) Allows devs to remove/override th validation check by setting the date check to Infinity.
   *
   * We will want to override the expiration check when it makes sense to exit expired stock, such
   * as in a correcting writing or loss exit.
   *
   * @param {Date} date - the comparison date that will be used in the validation.
   */
  StockExitItem.prototype.setComparisonExpirationDate = function setComparisonExpirationDate(date) {
    this._comparisonDate = date;
  };

  /**
   * @method isExpired
   *
   * @description
   * Returns true if the stock item is expired by using hte compaison date.
   */
  StockExitItem.prototype.isExpired = function isExpired() {
    return this._hasExpirationDate && this.expiration_date < this._comparisonDate;
  };

  /**
   * @function validate
   *
   * @description
   * Runs validation on the stock items.  The following checks are performed:
   *
   *  1) Is the item configured with a valid inventory item?
   *  2) Is a lot defined?
   *  3) Is the expiration date less than or equal to the comparison date?
   *  4) Is the quantity non-negative?
   */
  StockExitItem.prototype.validate = function validate() {

    // reset error array
    this._errors.length = 0;

    // FIXME - clean up these error codes
    // 1) Is the item configured with a valid inventory item?
    if (!this.inventory_uuid || !this.code) {
      this._errors.push('STOCK.ERRORS.NO_INVENTORY');
    }

    // 2) Is a lot defined?
    if (!this.lot_uuid) {
      this._errors.push('STOCK.ERRORS.NO_LOTS_DEFINED');
    }

    // 3) Is the expiration date less than or equal to the comparison date?
    if (this.isExpired()) {
      this._errors.push('STOCK.ERRORS.LOT_HAS_EXPIRED');
    }

    // 4) Is the quantity positive?
    if (this.quantity <= 0) {
      this._errors.push('STOCK.ERRORS.LOT_QUANTITY_IS_NOT_POSITIVE');
    }

    this._isValid = this._errors.length === 0;
    return this._isValid;
  };

  /**
   * @function configureInventory
   *
   * @description
   * Configures the inventory properties.
   */
  StockExitItem.prototype.configureInventory = function configureInventory(inventory) {
    this.code = inventory.code;
    this.text = inventory.text;
    this.inventory_uuid = inventory.inventory_uuid;
    this.unit_type = inventory.unit_type;
    this._initialised = true;
  };

  /**
   * @function configure
   *
   * @description
   * Configures the lot properties on the row.
   */
  StockExitItem.prototype.configure = function configure(item) {
    this.expiration_date = new Date(item.expiration_date);
    this.available = item.quantity;
    this.unit_cost = item.unit_cost;
    this.lot_uuid = item.uuid;

    this.validate();
  };

  return StockExitItem;
}
