angular.module('bhima.controllers')
  .controller('StockExitController', StockExitController);

// dependencies injections
StockExitController.$inject = [
  'NotifyService', 'SessionService', 'util',
  'bhConstants', 'ReceiptModal', 'StockExitFormService', 'StockService',
  'StockModalService', 'uiGridConstants', '$translate',
  'moment', 'GridExportService', 'Store',
  'PatientService', 'PatientInvoiceService', 'ServiceService',
];

/**
 * @class StockExitController
 *
 * @description
 * This controller is responsible to handle stock exit module.
 */
function StockExitController(
  Notify, Session, util, bhConstants, ReceiptModal,
  StockExitForm, Stock, StockModal, uiGridConstants, $translate,
  moment, GridExportService,
) {
  const vm = this;

  vm.form = new StockExitForm('StockExit');

  vm.gridApi = {};

  vm.selectedLots = [];
  vm.selectableInventories = [];
  vm.currentInventories = [];

  vm.reset = reset;
  vm.ROW_ERROR_FLAG = bhConstants.grid.ROW_ERROR_FLAG;
  vm.DATE_FMT = bhConstants.dates.format;
  vm.overconsumption = [];

  vm.onDateChange = date => {
    vm.form.setDate(date);
  };

  vm.onChangeDepot = depot => {
    vm.depot = depot;
    vm.form.setOriginDepot(depot);
  };

  // bind methods
  vm.maxLength = util.maxLength;
  vm.enterprise = Session.enterprise;
  vm.maxDate = new Date();
  vm.resetEntryExitTypes = false;

  vm.addItems = addItems;
  vm.removeItem = removeItem;
  vm.selectExitType = selectExitType;
  vm.submit = submit;

  const mapExit = {
    patient : { description : 'STOCK.EXIT_PATIENT', find : findPatient },
    service : { description : 'STOCK.EXIT_SERVICE', find : findService },
    depot : { description : 'STOCK.EXIT_DEPOT', find : findDepot },
    loss : { description : 'STOCK.EXIT_LOSS', find : configureLoss },
  };

  const gridFooterTemplate = `
    <div style="margin-left: 10px;">
      {{ grid.appScope.gridApi.core.getVisibleRows().length }}
      <span translate>STOCK.ROWS</span>
    </div>
  `;

  const gridOptions = {
    appScopeProvider : vm,
    enableSorting : false,
    enableColumnMenus : false,
    rowTemplate : 'modules/templates/grid/error.row.html',
    columnDefs : [
      {
        field : 'status',
        width : 25,
        displayName : '',
        cellTemplate : 'modules/stock/exit/templates/status.tmpl.html',
      }, {
        field : 'code',
        width : 120,
        displayName : 'INVENTORY.CODE',
        headerCellFilter : 'translate',
        cellTemplate : 'modules/stock/exit/templates/code.tmpl.html',
      }, {
        field : 'text',
        displayName : 'TABLE.COLUMNS.DESCRIPTION',
        headerCellFilter : 'translate',
      }, {
        field : 'lot',
        width : 250,
        displayName : 'TABLE.COLUMNS.LOT',
        headerCellFilter : 'translate',
        cellTemplate : 'modules/stock/exit/templates/lot.tmpl.html',
      }, {
        field : 'quantity',
        width : 150,
        displayName : 'TABLE.COLUMNS.QUANTITY',
        headerCellFilter : 'translate',
        cellTemplate : 'modules/stock/exit/templates/quantity.tmpl.html',
        aggregationType : uiGridConstants.aggregationTypes.sum,
      }, {
        field : 'unit_type',
        width : 75,
        displayName : 'TABLE.COLUMNS.UNIT',
        headerCellFilter : 'translate',
      }, {
        field : 'available',
        width : 150,
        displayName : 'TABLE.COLUMNS.AVAILABLE',
        headerCellFilter : 'translate',
      }, {
        field : 'expiration_date',
        width : 150,
        displayName : 'TABLE.COLUMNS.EXPIRE_IN',
        headerCellFilter : 'translate',
        cellTemplate : 'modules/stock/exit/templates/expiration.tmpl.html',
      },
      {
        displayName : '',
        field : 'actions',
        width : 25,
        cellTemplate : 'modules/stock/exit/templates/actions.tmpl.html',
      },
    ],
    data : vm.form.store.data,

    // fastWatch to false is required for updating the grid correctly for
    // inventories loaded from an invoice for patient exit
    fastWatch : false,
    flatEntityAccess : true,
    showGridFooter : true,
    gridFooterTemplate,
    onRegisterApi,
  };

  // exposing the grid options to the view
  vm.gridOptions = gridOptions;

  const exportation = new GridExportService(vm.gridOptions);

  /**
   * @method exportGrid
   * @description export the content of the grid to csv.
   */
  vm.exportGrid = () => {
    exportation.exportToCsv('Stock_Exit_', exportation.defaultColumnFormatter, vm.form.formatExportRows);
  };

  // reset the form after submission or on clear
  function reset(form) {
    vm.form.reset();
    vm.form.setOriginDepot(vm.depot);
    resetSelectedEntity();
    vm.resetEntryExitTypes = true;

    vm.form.validate();

    if (form) {
      form.$setPristine();
    }
  }

  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  function selectExitType(exitType) {
    mapExit[exitType.label].find();
    vm.form.store.clear();
    vm.resetEntryExitTypes = false;
  }

  // add items
  function addItems(n) {
    vm.form.addItems(n);
    vm.form.validate();
  }

  // remove item
  function removeItem(item) {
    vm.form.removeItem(item.uuid);
    vm.form.validate();
  }

  function startup() {
    vm.form.setup();
  }

  // find patient
  function findPatient() {
    StockModal.openFindPatient({ entity_uuid : vm.selectedEntityUuid })
      .then(patient => {
        if (patient) {
          vm.form.setExitToPatient(patient);
          setSelectedEntity(patient);
        } else {
          resetSelectedEntity();
        }
      })
      .catch(Notify.handleError);
  }

  // find service
  function findService() {
    StockModal.openFindService({ depot : vm.depot, entity_uuid : vm.selectedEntityUuid })
      .then(service => {
        if (service) {
          vm.form.setExitToService(service);
          setSelectedEntity(service);
        } else {
          resetSelectedEntity();
        }
      })
      .catch(Notify.handleError);
  }

  // find depot
  function findDepot() {
    StockModal.openFindDepot({ depot : vm.depot, entity_uuid : vm.selectedEntityUuid })
      .then(depot => {
        if (depot) {
          vm.form.setExitToDepot(depot);
          setSelectedEntity(depot);
        } else {
          resetSelectedEntity();
        }
      })
      .catch(Notify.handleError);
  }

  // configure loss
  function configureLoss() {
    vm.form.setExitToLoss();
    setSelectedEntity();
  }

  // binds to the bh-entry-exit-type component
  function setSelectedEntity(entity) {
    if (entity) {
      const uniformEntity = Stock.uniformSelectedEntity(entity);
      vm.reference = uniformEntity.reference;
      vm.displayName = uniformEntity.displayName;
      vm.selectedEntityUuid = uniformEntity.uuid;
      vm.requisition = (entity && entity.requisition) || {};
    }
  }

  function resetSelectedEntity() {
    vm.reference = null;
    vm.displayName = null;
    delete vm.selectedEntityUuid;
  }

  function reinit() {
    vm.form.reset();
    vm.form.setOriginDepot(vm.depot);
    resetSelectedEntity();
  }

  function submit(form) {
    if (form.$invalid) { return 0; }

    vm.form.validate();
    if (vm.form._errors.length) {
      // copy errors so that we aren't change-tracking as the user is fixing these
      // errors
      vm.errors = angular.copy(vm.form._errors);
      return 0;
    }

    const data = vm.form.formatDataForSubmission();

    vm.$loading = true;
    return Stock.movements.create(data)
      .then(doc => {
        // TODO - make this type agnostic
        ReceiptModal.stockExitPatientReceipt(doc.uuid, bhConstants.flux.TO_PATIENT);
        reinit(form);
      })
      .catch(Notify.handleError)
      .finally(() => { vm.$loading = false; });

  }

  startup();
}
