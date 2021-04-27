angular.module('bhima.services')
  .service('StockExitFormService', StockExitFormService);

StockExitFormService.$inject = [
  'StockExitItemService', 'Store', 'AppCache', 'SessionService', '$timeout',
  'bhConstants', 'moment', 'Pool', 'StockService', '$q', 'util', 'uuid',
];

/**
 * @class StockExitFormService
 *
 * @description
 * This service encapsulates the main logic that powers the stock exit module.  In particular,
 * it handles the totaling calculations and validation of the stock movement.
 */
function StockExitFormService(
  StockExitItem, Store, AppCache, Session, $timeout, bhConstants, moment,
  Pool, Stock, $q, util, UUID,
) {
  /**
   * @constructor
   */
  function StockExitForm(cacheKey) {
    if (!cacheKey) {
      throw new Error('StockExitForm expected a cacheKey, but it was not provided.');
    }

    this.cache = AppCache(cacheKey);

    // a reference to the current date to prevent too many lookups from happening.
    this.now = new Date();

    // store that powers the grid.
    this.store = new Store({ identifier : 'uuid' });

    // pool to keep the lots from being distributed multiple times.
    this.pool = new Pool('uuid');

    // run the initial setup
    this.setup();

    this.deferred = $q.resolve();
    this.ready = () => this.deferred;

    // stores the current lots in stock
    // used for determining if the stock exit will result in negative stock in the future.
    this.currentLotsInStock = new Store({ identifier : 'uuid' });
  }

  /**
   * @method setup
   *
   * @description
   * This function initializes the stock exit form with data.
   */
  StockExitForm.prototype.setup = function setup() {
    this.details = {
      date : new Date(),
      user_id : Session.user.id,

      // generate a document_uuid in the client to prevent multiple submit()s from creating
      // multiple records
      document_uuid : UUID(),
    };

    // predefine the entity
    this.entity = {};
  };

  StockExitForm.prototype.getLotsInStockAtDate = function getLotsInStockAtDate(date = new Date()) {
    if (!this.details.depot_uuid) { return 0; }

    return Stock.lots.read(null, {
      depot_uuid : this.details.depot_uuid,
      dateTo : date,
      includeEmptyLot : 0, // FIXME(@jniles) make this plural
    });
  };

  StockExitForm.prototype.setupStockForDepot = function setupStockForDepot() {
    this.currentLotsInStock.clear();

    // Load the current lots in stock.  This is used in a sanity
    // check validation to ensure we don't distribute more in the past
    // than we have in stock currently.  Otherwise, that will cause the current
    // quantity in stock to be negative.
    return this.getLotsInStockAtDate(new Date())
      .then((lots) => {

        // we only need a few key properties. Let the
        const slimmed = lots.map(lot => ({
          uuid : lot.uuid,
          quantity : lot.quantity,
          expiration_date : new Date(lot.expiration_date),
          inventory_uuid : lot.inventory_uuid,
          text : lot.text,
          available : lot.quantity,
          label : lot.label,
        }));

        // these both should have basically the same information
        this.currentLotsInStock.setData(slimmed);
        this.pool.initialize('uuid', lots);
        this._collateAvailableInventoryItems();
      });
  };

  /**
   * @function onSelectInventory
   */
  StockExitForm.prototype.onSelectInventory = function onSelectInventory(row, inventory) {
    console.log('row:', row);
    console.log('inventory:', inventory);
    row.configureInventory(inventory);
    row.setComparisonExpirationDate(this.details.date);
    this.validate();
  };

  /**
   * @method onSelectLot
   *
   * @description
   * Releases any previous lots from the pool so they can be used again, and uses
   * and configures the new lot.
   *
   */
  StockExitForm.prototype.onSelectLot = function onSelectLot(row, newLot, oldLot) {

    console.log('onSelectLot:', row, newLot, oldLot);

    if (oldLot.lot_uuid) {
      this.pool.release(oldLot.lot_uuid);
    }

    this.pool.use(newLot.lot_uuid);
    row.configure(newLot);

    // update inventory list.
    this._collateAvailableInventoryItems();
  };

  StockExitForm.prototype.selectEntity = function selectEntity(entity, type) {
    this.entity.instance = entity;
    this.entity.uuid = entity.uuid;
    this.entity.type = type;
  };

  /**
   * @function importLotsFromProcess
   *
   * @description
   * Imports lots that are formatted correctly to set the grid data.
   *
   * TODO(@jniles) - find a better name
   */
  StockExitForm.prototype.importLotsFromProcess = function importLotsFromProcess(lots) {
    this.ready()
      .then(() => {
        // TODO
      });
  };

  StockExitForm.prototype.isReadyForStockExit = function isReadyForStockExit() {
    const bool = this.details
      && this.details.depot_uuid
      && this.details.date
      && Object.keys(this.entity).length > 0
      && this.pool.size() > 0;

    return Boolean(bool);
  };

  /**
   * @method setExitType
   *
   * @description
   * Sets the type of the exit movement.
   */
  StockExitForm.prototype.setExitType = function setExitType(typeId) {
    this.details.type_id = typeId;
  };

  // TODO
  StockExitForm.prototype.setExitToPatient = function setExitToPatient(patient) {
    console.log('setting patient:', patient);
    this.selectEntity(patient, 'patient');

    // TODO - loadInvoiceInventories
  };

  // TODO
  StockExitForm.prototype.setExitToService = function setExitToService(service) {
    console.log('setting service:', service);
    this.selectEntity(service, 'service');
  };

  // TODO
  StockExitForm.prototype.setExitToDepot = function setExitToDepot(depot) {
    console.log('setting depot:', depot);
    this.selectEntity(depot, 'depot');
  };

  // TODO
  StockExitForm.prototype.setExitToLoss = function setExitToLoss() {
    console.log('setting loss');
    this.selectEntity({ }, 'loss');
  };

  // TODO
  StockExitForm.prototype.loadRequisitions = function loadRequisition() {

  };

  /**
   * @method setDate
   *
   * @description
   * Sets the date on the form.  By default, this is the current date.  However,
   * if the user changes the date, the service will look up the stock available
   * on that date.
   *
   */
  StockExitForm.prototype.setDate = function setDate(date) {
    this.details.date = date;

    // check if we are in a past date
    const isPreviousDate = this.details.date.toLocaleDateString() !== this.now.toLocaleDateString();

    if (isPreviousDate) {
      this.getLotsInStockAtDate(this.details.date)
        .then(lots => {
          this.pool.initialize('uuid', lots);
          this._collateAvailableInventoryItems();
          this.validate();
        });
    }
  };

  /**
   * @method setOriginDepot
   *
   * @description
   * Sets the depot the form will use as the exit depot.
   *
   * Note that if the depot changes, we'll need to refresh both the current stock
   * values and the previous stock values.
   *
   * @param {Object} depot - the depot to use as the exit depot
   */
  StockExitForm.prototype.setOriginDepot = function setOriginDepot(depot) {

    // check that the depot has actually changed.  If it hasn't, bail.
    if (depot.uuid === this.details.depot_uuid) { return; }

    this.details.depot_uuid = depot.uuid;

    // if we switch depots, we need to reload the quantities in stock
    this.deferred = $q.all([
      this.getLotsInStockAtDate(this.details.depot_uuid),
      this.setupStockForDepot(),
    ]);
  };

  /**
   * @function listAvailableInventoryItems
   *
   * @description
   * Lists the inventory items that are available use in the exit grid.
   *
   */
  StockExitForm.prototype.listAvailableInventoryItems = function listAvailableInventoryItems() {
    return this.inventory;
  };

  StockExitForm.prototype.listAvailableLots = function listAvailableLots(row) {
    return this.pool.available.data
      .filter(item => item.inventory_uuid === row.inventory_uuid);
  };

  StockExitForm.prototype._collateAvailableInventoryItems = function _collateAvailableInventoryItems() {
    this.inventory = util.uniqBy(this.pool.list(), 'inventory_uuid');
  };

  /**
   * @method addItems
   *
   * @description
   * Adds an item to the grid.
   *
   * @param {Number} n - the number of items to add to the grid
   */
  StockExitForm.prototype.addItems = function addItems(n) {
    let elt;
    let i = n;

    // will repeat will n > 0
    while (i--) {
      elt = new StockExitItem();
      this.store.post(elt);
    }

    return elt;
  };

  /**
   * @method removeItem
   *
   * @description
   * This method removes an item from the grid store by its uuid
   */
  StockExitForm.prototype.removeItem = function removeItem(uuid) {
    this.pool.release(uuid);
    this._collateAvailableInventoryItems();
    return this.store.remove(uuid);
  };

  /**
   * @method clear
   *
   * @description
   * This method clears the entire grid, removing all items from the grid.
   */
  StockExitForm.prototype.clear = function clear() {
    this.store.clear();

    $timeout(() => {
      this.setup();

      // validate() is only set up to test on submission as it checks the validity
      // of individual items which will not have been configured, manually
      // reset error state
      delete this._error;
    });
  };
  /**
   * @function errorLineHighlight
   *
   * @description
   * Sets the grid's error flag on the row to render a red highlight
   * on the row.
   */
  function errorLineHighlight(rowIdx, store) {
    const { ROW_ERROR_FLAG } = bhConstants.grid;
    // set and unset error flag for allowing to highlight again the row
    // when the user click again on the submit button
    const row = store.data[rowIdx];
    row[ROW_ERROR_FLAG] = true;
    $timeout(() => {
      row[ROW_ERROR_FLAG] = false;
    }, 1000);
  }

  /**
   * @method validate
   *
   * @description
   * Runs the validation function on every row in the stock form's store.  It also
   * checks for global correctness, including:
   *
   *  1) Ensure a destination is set (depot, patient, loss, service)
   *  2) Ensure no lot is overconsumed.
   *  3) Ensure that the consumption will not render a future consumption negative
   *
   * @returns boolean
   */
  StockExitForm.prototype.validate = function validate() {

    // check that each individual line is coherent.
    const hasValidLots = this.store.data.every(item => item.validate());

    // check that we won't result in a future negative value
    // NOTE(@jniles) this check alone is not sufficient because we may dip into a negative
    // value briefly and then become coherent again.  The server will also check for negative
    // values, but this check will catch any obvious mistakes early.
    const invalidFutureQuantities = this.store.data.filter(row => {

      // get the future lot
      const futureLot = this.currentLotsInStock.get(row.lot_uuid);

      // if the future lot does not exist, then we've consumed 100% of it at some point (since we are
      // looking for only lots present in the depot).  This is an error
      if (!futureLot) { return true; }

      // if the future lot quantity is less then the current proposed exit quantity,
      // the exit will result in a
      if (futureLot.quantity < row.quantity) { return true; }

      return false;
    });

    const hasValidQuantities = invalidFutureQuantities.length === 0;

    return hasValidLots && hasValidQuantities;
  };

  StockExitForm.prototype.reset = function reset() {
    this.currentLotsInStock.clear();
    this.pool.clear();
    this.setup();
  };

  /**
   * @method formatExportRows
   *
   * @description
   * Used in the stock exit form to download the working sheet in Excel format.
   *
   * @param {array} rows - refer to the grid data array
   * @return {array} - return an array of array with value as an object in this format : { value : ... }
   */
  StockExitForm.prototype.formatExportRows = function formatExportRows(rows = []) {
    return rows.map(row => {
      const code = row.inventory && row.inventory.code ? row.inventory.code : null;
      const description = row.inventory && row.inventory.text ? row.inventory.text : null;
      const lot = row.lot && row.lot.label ? row.lot.label : null;
      const price = row.inventory && row.inventory.unit_cost ? row.inventory.unit_cost : null;
      const quantity = row.quantity ? row.quantity : null;
      const type = row.quantity && row.inventory.unit_type ? row.inventory.unit_type : null;
      const available = row.inventory && row.inventory.quantity ? row.inventory.quantity : null;
      const amount = row.inventory && row.inventory.unit_cost && row.quantity
        ? row.inventory.unit_cost * row.quantity : 0;
      const expiration = row.lot && row.lot.expiration_date
        ? moment(row.lot.expiration_date).format(bhConstants.dates.formatDB) : null;

      return [code, description, lot, price, quantity, type, available, amount, expiration].map(value => ({ value }));
    });

  };

  return StockExitForm;
}
