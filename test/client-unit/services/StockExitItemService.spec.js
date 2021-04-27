/* global inject, expect, chai */

describe('StockExitItemService', () => {

  beforeEach(module('bhima.services', 'bhima.mocks', 'bhima.StockMocks'));

  let StockExitItem;
  let lots;
  let inventory;

  beforeEach(inject((StockExitItemService, MockStockDataService) => {
    StockExitItem = StockExitItemService;
    lots = MockStockDataService.flatLotsFromSingleInventory();
    inventory = MockStockDataService.singleInventoryFormStoreData();
  }));

  it('constructs a stock exit item', () => {
    const item = new StockExitItem();

    expect(item.lot_uuid).to.equal(null);
    expect(item.inventory_uuid).to.equal(null);
    expect(item.label).to.equal(null);
    expect(item.quantity).to.equal(0);

    // validation properties
    expect(item._initialised).to.equal(false);
    expect(item._errors).to.have.length(3);
  });

  it('#configureInventory() sets the basic invntory properties', () => {
    const item = new StockExitItem();
    expect(item._initialised).to.equal(false);

    item.configureInventory(inventory);

    expect(item.text).to.equal(inventory.text);
    expect(item.code).to.equal(inventory.code);
    expect(item.unit_type).to.equal(inventory.unit_type);
    expect(item._initialised).to.equal(true);
  });

  it('#configure() sets basic properties on the item', () => {
    const item = new StockExitItem();
    expect(item._initialised).to.equal(false);

    const [lot] = lots;
    item.configure(lot);
    expect(item.quantity).to.equal(0);
    expect(item.available).to.equal(lot.quantity);
    expect(item.lot_uuid).to.equal(lot.uuid);
  });

  it('#isExpired() uses the comparison date for expiration date errors', () => {
    const item = new StockExitItem();
    const [lot] = lots;
    item.configure(lot);

    // by default, the lot is expired (date is 2019)
    expect(item.isExpired()).to.equal(true);

    // set the comparison date to Jan 1 2000
    item.setComparisonExpirationDate(new Date('2000-01-01'));

    // check to ensure this is now false
    expect(item.isExpired()).to.equal(false);
  });

  it('#configure() should run validate()', () => {
    const item = new StockExitItem();
    chai.spy.on(item, 'validate');

    const [lot] = lots;
    item.configure(lot);

    expect(item.validate).to.have.been.called();
  });

  it('#validate() creates a list of errors', () => {
    const item = new StockExitItem();
    const [lot] = lots;
    item.configure(lot);

    expect(item._errors).to.deep.equal([
      'STOCK.ERRORS.NO_INVENTORY',
      'STOCK.ERRORS.LOT_HAS_EXPIRED',
      'STOCK.ERRORS.LOT_QUANTITY_IS_NOT_POSITIVE',
    ]);

    // now, we change the quantity to make it 0
    item.quantity = 0;
    item.validate();

    // we should gain the quantity error
    expect(item._errors).to.deep.equal([
      'STOCK.ERRORS.NO_INVENTORY',
      'STOCK.ERRORS.LOT_HAS_EXPIRED',
      'STOCK.ERRORS.LOT_QUANTITY_IS_NOT_POSITIVE',
    ]);

    // now, we make the lot 'unexpired' by changing the comparison date back
    item.setComparisonExpirationDate(new Date('2000-01-01'));
    item.validate();

    // we should lose the expiration date error
    expect(item._errors).to.deep.equal([
      'STOCK.ERRORS.NO_INVENTORY',
      'STOCK.ERRORS.LOT_QUANTITY_IS_NOT_POSITIVE',
    ]);

    // finally set the quantity positive again.
    item.quantity = 30;
    delete item.lot_uuid;
    item.validate();

    // now we haver only two errors
    expect(item._errors).to.deep.equal([
      'STOCK.ERRORS.NO_INVENTORY',
      'STOCK.ERRORS.NO_LOTS_DEFINED',
    ]);
  });

});
