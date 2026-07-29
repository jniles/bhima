angular.module('bhima.components')
  .component('bhServiceOrDepot', {
    templateUrl : 'js/components/bhServiceOrDepot/bhServiceOrDepot.html',
    controller  : bhServiceOrDepotController,
    transclude  : true,
    bindings    : {
      uuid             : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

bhServiceOrDepotController.$inject = [
  'ServiceService', 'DepotService', 'StockService', 'NotifyService', '$q',
];

const SERVICE_REQUESTOR_TYPE = 1;
const DEPOT_REQUESTOR_TYPE = 2;

/**
 * service or depot selection component
 * @param Services
 * @param Depots
 * @param Stock
 * @param Notify
 * @param $q
 */
function bhServiceOrDepotController(Services, Depots, Stock, Notify, $q) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'REQUISITION.SERVICE_OR_DEPOT';

    $q.all([
      Stock.stockRequestorType.read(),
      Depots.read(),
      Services.read(),
    ])
      .then(initCollections)
      .catch(Notify.handleError);
  };

  // react to the parent changing the bound uuid after collections have loaded
  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.uuid && !changes.uuid.isFirstChange() && $ctrl.requestors) {
      $ctrl.requestorType = findRequestorType($ctrl.uuid);
    }
  };

  /**
   *
   * @param root0
   * @param root0."0"
   * @param root0."1"
   * @param root0."2"
   */
  function initCollections([requestors, depots, services]) {
    Object.assign($ctrl, { requestors, depots, services });

    $ctrl.serviceUuids = $ctrl.services.map(service => service.uuid);
    $ctrl.depotIds = $ctrl.depots.map(depot => depot.uuid);

    if ($ctrl.uuid) {
      $ctrl.requestorType = findRequestorType($ctrl.uuid);
    }
  }

  /**
   *
   * @param identifier
   */
  function findRequestorType(identifier) {
    if ($ctrl.serviceUuids.includes(identifier)) {
      return $ctrl.requestors.find(row => row.id === SERVICE_REQUESTOR_TYPE);
    }

    if ($ctrl.depotIds.includes(identifier)) {
      return $ctrl.requestors.find(row => row.id === DEPOT_REQUESTOR_TYPE);
    }

    return null;
  }

  $ctrl.onChangeRequestor = () => {
    $ctrl.requestorUuid = null;
    $ctrl.onSelectCallback({ requestor : {} });
  };

  $ctrl.onSelectRequestor = (requestor) => {
    const selected = Object.assign({}, requestor, {
      requestor_type_id : $ctrl.requestorType.id,
    });

    $ctrl.requestorUuid = selected.uuid;
    $ctrl.onSelectCallback({ requestor : selected });
  };
}
