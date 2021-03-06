'use strict';

(function () {
  var HEIGHT_TAIL_MAIN_PIN = 22;
  var PIN_WIDTH = 50;
  var PIN_HEIGHT = 70;
  var ESC = 'Escape';
  var ENTER = 'Enter';
  var MOUSE_BUTTON = 0;
  var MIN_COORDINATE_Y = 130;
  var MAX_COORDINATE_Y = 630;
  var MIN_COORDINATE_X = 0;
  var POINTER = 84;

  var mapOverlay = document.querySelector('.map__overlay');
  var mapPins = window.map.container.querySelector('.map__pins');
  var mapSection = document.querySelector('.map');
  var mapFiltersContainer = document.querySelector('.map__filters-container');
  var mapPinMain = window.map.container.querySelector('.map__pin--main');
  var maxWidth = mapOverlay.offsetWidth;
  var pinImage = mapPinMain.querySelector('img');
  var mapFilters = document.querySelector('.map__filters');
  var halfPinWidth = mapPinMain.offsetWidth / 2;
  var pinTemplate = document.body.querySelector('#pin')
    .content
    .querySelector('button');
  var errorTemplate = document.querySelector('#error')
    .content
    .querySelector('.error');
  var errorElement = errorTemplate.cloneNode(true);
  var mainSection = document.querySelector('main');

  var pins = [];

  var onLeftMouseDownProcess = function (evt) {
    if (evt.button === MOUSE_BUTTON) {
      evt.preventDefault();
      window.map.deleteUnactiveMode();
    }
  };

  var onEnterProcess = function (evt) {
    if (evt.key === ENTER) {
      window.map.deleteUnactiveMode();
    }
  };

  var stopMainPinEventListener = function () {
    mapPinMain.removeEventListener('keydown', onEnterProcess);
    mapPinMain.removeEventListener('mousedown', onLeftMouseDownProcess);
  };

  var startMainPinEventListener = function () {
    mapPinMain.addEventListener('keydown', onEnterProcess);
    mapPinMain.addEventListener('mousedown', onLeftMouseDownProcess);
  };

  mapPinMain.addEventListener('mousedown', function (evt) {
    evt.preventDefault();

    var mapCoordinate = mapOverlay.getBoundingClientRect();

    var onMouseMove = function (moveEvt) {
      moveEvt.preventDefault();

      var coordinateX = moveEvt.clientX - mapCoordinate.left;
      var coordinateY = moveEvt.clientY - mapCoordinate.top;

      coordinateX = Math.max(MIN_COORDINATE_X, Math.min(maxWidth, coordinateX)) - halfPinWidth;
      coordinateY = Math.max(MIN_COORDINATE_Y, Math.min(MAX_COORDINATE_Y, coordinateY)) - POINTER;

      mapPinMain.style.left = coordinateX + 'px';
      mapPinMain.style.top = coordinateY + 'px';

      getMainPinAddress();
    };

    var onMouseUp = function (upEvt) {
      upEvt.preventDefault();

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  var getMainPinAddress = function () {
    var leftCoord = mapPinMain.offsetLeft;
    var topCoord = mapPinMain.offsetTop + POINTER;
    var adress = window.map.addressInput.value = leftCoord + ', ' + topCoord;

    if (window.map.isActivated) {
      leftCoord = mapPinMain.offsetLeft + pinImage.width / 2;
      topCoord = mapPinMain.offsetTop + pinImage.height / 2 + HEIGHT_TAIL_MAIN_PIN;
      adress = window.map.addressInput.value = leftCoord + ', ' + topCoord;
    }

    return adress;
  };

  var renderPin = function (data) {
    var pinElement = pinTemplate.cloneNode(true);
    pinElement.style.left = data.location.x - PIN_WIDTH / 2 + 'px';
    pinElement.style.top = data.location.y - PIN_HEIGHT + 'px';
    pinElement.querySelector('img').src = data.author.avatar;
    pinElement.querySelector('img').alt = data.offer.title;
    pinElement.addEventListener('click', function () {
      var activePin = document.querySelector('.map__pin--active');

      if (activePin) {
        activePin.classList.remove('map__pin--active');
      }

      mapSection.insertBefore(window.card.render(data), mapFiltersContainer);
      pinElement.classList.add('map__pin--active');

      window.card.closeButton.addEventListener('click', window.card.onLeftMouseClose);
      document.addEventListener('keydown', window.card.onEscClose);
    });
    return pinElement;
  };

  var getFromServer = function (data) {
    var fragment = document.createDocumentFragment();
    data.forEach(function (dataPins) {
      fragment.appendChild(renderPin(dataPins));
    });
    return mapPins.appendChild(fragment);
  };

  var renderPins = window.debounce(function () {
    removeAll();
    getFromServer(window.filter.setSort(pins));
  });

  var request = function () {
    window.load.loadData(onSuccess, onError);
  };

  var deleteServerPins = function (serverPins) {
    var elements = Array.from(serverPins);
    elements.forEach(function (element) {
      element.remove();
    });
  };

  var removeAll = function () {
    var pinButtons = mapPins.querySelectorAll('.map__pin:not(.map__pin--main)');
    deleteServerPins(pinButtons);
  };

  var onFiltersChange = function () {
    renderPins();
  };

  var onSuccess = function (data) {
    pins = data;
    renderPins();
    window.map.enabledElements(mapFilters);
    startFiltersEventListener();
  };

  var onError = function (errorMessage) {
    var messageText = errorElement.querySelector('p');
    messageText.textContent = errorMessage;
    document.addEventListener('click', onCloseErrorLeftMouse);
    document.addEventListener('keydown', onCloseErrorEsc);
    mainSection.insertAdjacentElement('afterbegin', errorElement);
  };

  var onCloseSeverError = function (el) {
    el.remove();
    request();
  };

  var onCloseErrorLeftMouse = function (evt) {
    if (evt.button === MOUSE_BUTTON) {
      onCloseSeverError(errorElement);
      document.removeEventListener('click', onCloseErrorLeftMouse);
    }
  };

  var onCloseErrorEsc = function (evt) {
    if (evt.key === ESC) {
      evt.preventDefault();
      onCloseSeverError(errorElement);
      document.removeEventListener('keydown', onCloseErrorEsc);
    }
  };

  var stopFiltersEventListener = function () {
    mapFilters.removeEventListener('change', onFiltersChange);
    mapFilters.removeEventListener('change', window.card.onCloseDeclaration);
  };

  var startFiltersEventListener = function () {
    mapFilters.addEventListener('change', onFiltersChange);
    mapFilters.addEventListener('change', window.card.onCloseDeclaration);
  };

  window.pin = {
    mainSection: mainSection,
    mapFilters: mapFilters,
    getMainPinAddress: getMainPinAddress,
    startMainPinEventListener: startMainPinEventListener,
    stopMainPinEventListener: stopMainPinEventListener,
    stopFiltersEventListener: stopFiltersEventListener,
    startFiltersEventListener: startFiltersEventListener,
    getFromServer: getFromServer,
    onError: onError,
    request: request,
    remove: removeAll
  };
})();
