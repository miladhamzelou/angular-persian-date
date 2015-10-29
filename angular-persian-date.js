angular.module('ui.bootstrap.dateparser', [])

.service('dateParser', ['$locale', 'orderByFilter', function($locale, orderByFilter) {

  this.parsers = {};

  var formatCodeToRegex = {
    'yyyy': {
      regex: '\\d{4}',
      apply: function(value) { this.year = +value; }
    },
    'yy': {
      regex: '\\d{2}',
      apply: function(value) { this.year = +value + 2000; }
    },
    'y': {
      regex: '\\d{1,4}',
      apply: function(value) { this.year = +value; }
    },
    'MMMM': {
      regex: $locale.DATETIME_FORMATS.MONTH.join('|'),
      apply: function(value) { this.month = $locale.DATETIME_FORMATS.MONTH.indexOf(value); }
    },
    'MMM': {
      regex: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
      apply: function(value) { this.month = $locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value); }
    },
    'MM': {
      regex: '0[1-9]|1[0-2]',
      apply: function(value) { this.month = value - 1; }
    },
    'M': {
      regex: '[1-9]|1[0-2]',
      apply: function(value) { this.month = value - 1; }
    },
    'dd': {
      regex: '[0-2][0-9]{1}|3[0-1]{1}',
      apply: function(value) { this.date = +value; }
    },
    'd': {
      regex: '[1-2]?[0-9]{1}|3[0-1]{1}',
      apply: function(value) { this.date = +value; }
    },
    'EEEE': {
      regex: $locale.DATETIME_FORMATS.DAY.join('|')
    },
    'EEE': {
      regex: $locale.DATETIME_FORMATS.SHORTDAY.join('|')
    }
  };

  function createParser(format) {
    var map = [], regex = format.split('');

    angular.forEach(formatCodeToRegex, function(data, code) {
      var index = format.indexOf(code);

      if (index > -1) {
        format = format.split('');

        regex[index] = '(' + data.regex + ')';
        format[index] = '$'; // Custom symbol to define consumed part of format
        for (var i = index + 1, n = index + code.length; i < n; i++) {
          regex[i] = '';
          format[i] = '$';
        }
        format = format.join('');

        map.push({ index: index, apply: data.apply });
      }
    });

    return {
      regex: new RegExp('^' + regex.join('') + '$'),
      map: orderByFilter(map, 'index')
    };
  }

  this.parse = function(input, format) {
    if ( !angular.isString(input) || !format ) {
      return input;
    }

    format = $locale.DATETIME_FORMATS[format] || format;

    if ( !this.parsers[format] ) {
      this.parsers[format] = createParser(format);
    }

    var parser = this.parsers[format],
        regex = parser.regex,
        map = parser.map,
        results = input.match(regex);

    if ( results && results.length ) {
      var fields = { year: 1900, month: 0, date: 1, hours: 0 }, dt;

      for( var i = 1, n = results.length; i < n; i++ ) {
        var mapper = map[i-1];
        if ( mapper.apply ) {
          mapper.apply.call(fields, results[i]);
        }
      }

      if ( isValid(fields.year, fields.month, fields.date) ) {
        dt = new Date( fields.year, fields.month, fields.date, fields.hours);
      }

      return dt;
    }
  };

  // Check if date is valid for specific month (and year for February).
  // Month: 0 = Jan, 1 = Feb, etc
  function isValid(year, month, date) {
    if ( month === 1 && date > 28) {
        return date === 29 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
    }

    if ( month === 3 || month === 5 || month === 8 || month === 10) {
        return date < 31;
    }

    return true;
  }
}]);


angular.module("ui.bootstrap.persian.datepicker.tpls", ["template/persianDatepicker/datepicker.html","template/persianDatepicker/day.html","template/persianDatepicker/month.html","template/persianDatepicker/popup.html","template/persianDatepicker/year.html"]);
angular.module('ui.bootstrap.persian.datepicker', ['ui.bootstrap.dateparser', 'ui.bootstrap.position','ui.bootstrap.persian.datepicker.tpls','persianDate'])




.filter('EnToFaNumber',function() {
		return function(input) {
			if(input == undefined) return;
			var ret="",symbolMap = {
		        '1': '۱',
		        '2': '۲',
		        '3': '۳',
		        '4': '۴',
		        '5': '۵',
		        '6': '۶',
		        '7': '۷',
		        '8': '۸',
		        '9': '۹',
		        '0': '۰'
		    };
		    input = input.toString();
			for(var i=0;i<input.length;i++)
				if(symbolMap[input[i]])
					ret += symbolMap[input[i]];
				else
					ret += input[i];
			
			return ret;
		};
	})








.constant('datepickerConfig', {
  formatDay: 'dd',
  formatMonth: 'MMMM',
  formatYear: 'yyyy',
  formatDayHeader: 'EEE',
  formatDayTitle: 'MMMM yyyy',
  formatMonthTitle: 'yyyy',
  datepickerMode: 'day',
  minMode: 'day',
  maxMode: 'year',
  showWeeks: true,
  startingDay: 6,
  yearRange: 20,
  minDate: null,
  maxDate: null
})

.controller('ui.bootstrap.persian.datepicker.DatepickerController', ['$scope', '$attrs', '$parse', '$interpolate', '$timeout', '$log', 'dateFilter', 'datepickerConfig','PersianDateService','persianDateFilter', function($scope, $attrs, $parse, $interpolate, $timeout, $log, dateFilter, datepickerConfig,PersianDateService,persianDateFilter) {
  var self = this,
      ngModelCtrl = { $setViewValue: angular.noop }; // nullModelCtrl;

  // Modes chain
  this.modes = ['day', 'month', 'year'];

  // Configuration attributes
  angular.forEach(['formatDay', 'formatMonth', 'formatYear', 'formatDayHeader', 'formatDayTitle', 'formatMonthTitle',
                   'minMode', 'maxMode', 'showWeeks', 'startingDay', 'yearRange'], function( key, index ) {
    self[key] = angular.isDefined($attrs[key]) ? (index < 8 ? $interpolate($attrs[key])($scope.$parent) : $scope.$parent.$eval($attrs[key])) : datepickerConfig[key];
  });

  // Watchable date attributes
  angular.forEach(['minDate', 'maxDate'], function( key ) {
    if ( $attrs[key] ) {
      $scope.$parent.$watch($parse($attrs[key]), function(value) {
        self[key] = value ? new Date(value) : null;
        self.refreshView();
      });
    } else {
      self[key] = datepickerConfig[key] ? new Date(datepickerConfig[key]) : null;
    }
  });

  $scope.datepickerMode = $scope.datepickerMode || datepickerConfig.datepickerMode;
  $scope.uniqueId = 'datepicker-' + $scope.$id + '-' + Math.floor(Math.random() * 10000);
  this.activeDate = angular.isDefined($attrs.initDate) ? $scope.$parent.$eval($attrs.initDate) : new Date();

  $scope.isActive = function(dateObject) {
    if (self.compare(dateObject.date, self.activeDate) === 0) {
      $scope.activeDateId = dateObject.uid;
      return true;
    }
    return false;
  };

  this.init = function( ngModelCtrl_ ) {
    ngModelCtrl = ngModelCtrl_;

    ngModelCtrl.$render = function() {
      self.render();
    };
  };

  this.render = function() {
    if ( ngModelCtrl.$modelValue ) {
      var date = new Date( ngModelCtrl.$modelValue ),
          isValid = !isNaN(date);

      if ( isValid ) {
        this.activeDate = date;
      } else {
        $log.error('Datepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
      }
      ngModelCtrl.$setValidity('date', isValid);
    }
    this.refreshView();
  };

  this.refreshView = function() {
    if ( this.element ) {
      this._refreshView();

      var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
      ngModelCtrl.$setValidity('date-disabled', !date || (this.element && !this.isDisabled(date)));
    }
  };

  this.createDateObject = function(date, format) {
    var model = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
    return {
      date: date,
	  
      //label: dateFilter(date, format),
	  label: persianDateFilter(date, format),
	  
      selected: model && this.compare(date, model) === 0,
      disabled: this.isDisabled(date),
      current: this.compare(date, new Date()) === 0
    };
  };

  this.isDisabled = function( date ) {
    return ((this.minDate && this.compare(date, this.minDate) < 0) || (this.maxDate && this.compare(date, this.maxDate) > 0) || ($attrs.dateDisabled && $scope.dateDisabled({date: date, mode: $scope.datepickerMode})));
  };

  // Split array into smaller arrays
  this.split = function(arr, size) {
    var arrays = [];
    while (arr.length > 0) {
      arrays.push(arr.splice(0, size));
    }
    return arrays;
  };

  $scope.select = function( date ) {
    if ( $scope.datepickerMode === self.minMode ) {
      var dt = ngModelCtrl.$modelValue ? new Date( ngModelCtrl.$modelValue ) : new Date(0, 0, 0, 0, 0, 0, 0);
      dt.setFullYear( date.getFullYear(), date.getMonth(), date.getDate() );
      ngModelCtrl.$setViewValue( dt );
      ngModelCtrl.$render();
    } else {
      self.activeDate = date;
      $scope.datepickerMode = self.modes[ self.modes.indexOf( $scope.datepickerMode ) - 1 ];
    }
  };

  $scope.move = function( direction ) {
    //var year = self.activeDate.getFullYear() + direction * (self.step.years || 0),
   //     month = self.activeDate.getMonth() + direction * (self.step.months || 0);
	var year = PersianDateService.getFullYear(self.activeDate) + direction * (self.step.years || 0),
	month = PersianDateService.getMonth(self.activeDate) + direction * (self.step.months || 0);
	
	
    //self.activeDate.setFullYear(year, month, 1);
	self.activeDate = PersianDateService.persian_to_gregorian_Date(year,month,1);
	
    self.refreshView();
  };

  $scope.toggleMode = function( direction ) {
    direction = direction || 1;

    if (($scope.datepickerMode === self.maxMode && direction === 1) || ($scope.datepickerMode === self.minMode && direction === -1)) {
      return;
    }

    $scope.datepickerMode = self.modes[ self.modes.indexOf( $scope.datepickerMode ) + direction ];
  };

  // Key event mapper
  $scope.keys = { 13:'enter', 32:'space', 33:'pageup', 34:'pagedown', 35:'end', 36:'home', 37:'left', 38:'up', 39:'right', 40:'down' };

  var focusElement = function() {
    $timeout(function() {
      self.element[0].focus();
    }, 0 , false);
  };

  // Listen for focus requests from popup directive
  $scope.$on('datepicker.focus', focusElement);

  $scope.keydown = function( evt ) {
    var key = $scope.keys[evt.which];

    if ( !key || evt.shiftKey || evt.altKey ) {
      return;
    }

    evt.preventDefault();
    evt.stopPropagation();

    if (key === 'enter' || key === 'space') {
      if ( self.isDisabled(self.activeDate)) {
        return; // do nothing
      }
      $scope.select(self.activeDate);
      focusElement();
    } else if (evt.ctrlKey && (key === 'up' || key === 'down')) {
      $scope.toggleMode(key === 'up' ? 1 : -1);
      focusElement();
    } else {
      self.handleKeyDown(key, evt);
      self.refreshView();
    }
  };
}])

.directive( 'persianDatepicker', function () {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'template/persianDatepicker/datepicker.html',
    scope: {
      datepickerMode: '=?',
      dateDisabled: '&'
    },
    require: ['persianDatepicker', '?^ngModel'],
    controller: 'ui.bootstrap.persian.datepicker.DatepickerController',
    link: function(scope, element, attrs, ctrls) {
      var datepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];

      if ( ngModelCtrl ) {
        datepickerCtrl.init( ngModelCtrl );
      }
    }
  };
})

.directive('persianDaypicker', ['dateFilter','PersianDateService','persianDateFilter', function (dateFilter,PersianDateService,persianDateFilter) {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'template/persianDatepicker/day.html',
    require: '^persianDatepicker',
    link: function(scope, element, attrs, ctrl) {
      scope.showWeeks = ctrl.showWeeks;

      ctrl.step = { months: 1 };
      ctrl.element = element;

      //var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      //function getDaysInMonth( year, month ) {
        //return ((month === 1) && (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0))) ? 29 : DAYS_IN_MONTH[month];
      //}

      function getDates(startDate, n) {
        var dates = new Array(n), current = new Date(startDate), i = 0;
        current.setHours(12); // Prevent repeated dates because of timezone bug
        while ( i < n ) {
          dates[i++] = new Date(current);
          current.setDate( current.getDate() + 1 );
        }
        return dates;
      }

      ctrl._refreshView = function() {

		//var year = ctrl.activeDate.getFullYear(),
		var year = PersianDateService.getFullYear(ctrl.activeDate),
		
		
		//month = ctrl.activeDate.getMonth(),
		month = PersianDateService.getMonth(ctrl.activeDate),


         //firstDayOfMonth = new Date(year, month, 1),
			firstDayOfMonth = PersianDateService.persian_to_gregorian_Date(year,month,1),

          difference = ctrl.startingDay - firstDayOfMonth.getDay(),
          numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : - difference,
          firstDate = new Date(firstDayOfMonth);

        if ( numDisplayedFromPreviousMonth > 0 ) {
          firstDate.setDate( firstDate.getDate() - numDisplayedFromPreviousMonth );
        }

        // 42 is the number of days on a six-month calendar
        var days = getDates(firstDate, 42);
        for (var i = 0; i < 42; i ++) {
          days[i] = angular.extend(ctrl.createDateObject(days[i], ctrl.formatDay), {
		  //secondary
            //secondary: days[i].getMonth() !== month,
			secondary: PersianDateService.getMonth(days[i]) !== month,
		//secondary
            uid: scope.uniqueId + '-' + i
          });
        }

        scope.labels = new Array(7);
        for (var j = 0; j < 7; j++) {
          scope.labels[j] = {
           // abbr: dateFilter(days[j].date, ctrl.formatDayHeader),
            //full: dateFilter(days[j].date, 'EEEE')
			abbr: persianDateFilter(days[j].date, ctrl.formatDayHeader),
            full: persianDateFilter(days[j].date, 'EEEE')
          };
        }

        //scope.title = dateFilter(ctrl.activeDate, ctrl.formatDayTitle);
		scope.title = persianDateFilter(ctrl.activeDate, ctrl.formatDayTitle);
        scope.rows = ctrl.split(days, 7);

        if ( scope.showWeeks ) {
          scope.weekNumbers = [];
          var weekNumber = getISO8601WeekNumber( scope.rows[0][0].date ),
              numWeeks = scope.rows.length;
          while( scope.weekNumbers.push((weekNumber<= 53 ? weekNumber++ : weekNumber-=52)) < numWeeks ) {}
        }
      };

      ctrl.compare = function(date1, date2) {
        return (new Date( date1.getFullYear(), date1.getMonth(), date1.getDate() ) - new Date( date2.getFullYear(), date2.getMonth(), date2.getDate() ) );
      };

      function getISO8601WeekNumber(date) {
        var checkDate = new Date(date);
        checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
        var time = checkDate.getTime();
        
        checkDate.setMonth(2); // Compare with 1 farvardin
        checkDate.setDate(15); // Compare with 1 farvardin
        
        if((time - checkDate)<0){
            return Math.floor(Math.round(((time + (86400000 * 365)) - checkDate) / 86400000) / 7) + 1;
        }
  
        //checkDate.setMonth(0); // Compare with Jan 1
        //checkDate.setDate(1);
        return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
      }

      ctrl.handleKeyDown = function( key, evt ) {
        var date = ctrl.activeDate.getDate();

        if (key === 'left') {
          date = date - 1;   // up
        } else if (key === 'up') {
          date = date - 7;   // down
        } else if (key === 'right') {
          date = date + 1;   // down
        } else if (key === 'down') {
          date = date + 7;
        } else if (key === 'pageup' || key === 'pagedown') {
          var month = ctrl.activeDate.getMonth() + (key === 'pageup' ? - 1 : 1);
          ctrl.activeDate.setMonth(month, 1);
		  
          //date = Math.min(getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth()), date);
		  date = Math.min(PersianDateService.persianMonthDays(PersianDateService.getFullYear(ctrl.activeDate), PersianDateService.getMonth(ctrl.activeDate) ), date);
		  
		  
        } else if (key === 'home') {
          date = 1;
        } else if (key === 'end') {
          //date = getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth());
		  date = PersianDateService.persianMonthDays(PersianDateService.getFullYear(ctrl.activeDate), PersianDateService.getMonth(ctrl.activeDate));
        }
        ctrl.activeDate.setDate(date);
      };

      ctrl.refreshView();
    }
  };
}])

.directive('persianMonthpicker', ['dateFilter','PersianDateService','persianDateFilter', function (dateFilter,PersianDateService,persianDateFilter) {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'template/persianDatepicker/month.html',
    require: '^persianDatepicker',
    link: function(scope, element, attrs, ctrl) {
      ctrl.step = { years: 1 };
      ctrl.element = element;

      ctrl._refreshView = function() {
        var months = new Array(12),
            //year = ctrl.activeDate.getFullYear();
			year = PersianDateService.getFullYear(ctrl.activeDate);
			
			
        for ( var i = 0; i < 12; i++ ) {
          //months[i] = angular.extend(ctrl.createDateObject(new Date(year, i, 1), ctrl.formatMonth), {
		  months[i] = angular.extend(ctrl.createDateObject(PersianDateService.persian_to_gregorian_Date(year, i, 1), ctrl.formatMonth), {
            uid: scope.uniqueId + '-' + i
          });
        }

        //scope.title = dateFilter(ctrl.activeDate, ctrl.formatMonthTitle);
		scope.title = persianDateFilter(ctrl.activeDate, ctrl.formatMonthTitle);
		
		
        scope.rows = ctrl.split(months, 3);
      };

      ctrl.compare = function(date1, date2) {
        return new Date( date1.getFullYear(), date1.getMonth() ) - new Date( date2.getFullYear(), date2.getMonth() );
      };

      ctrl.handleKeyDown = function( key, evt ) {
        var date = ctrl.activeDate.getMonth();

        if (key === 'left') {
          date = date - 1;   // up
        } else if (key === 'up') {
          date = date - 3;   // down
        } else if (key === 'right') {
          date = date + 1;   // down
        } else if (key === 'down') {
          date = date + 3;
        } else if (key === 'pageup' || key === 'pagedown') {
          var year = ctrl.activeDate.getFullYear() + (key === 'pageup' ? - 1 : 1);
          ctrl.activeDate.setFullYear(year);
        } else if (key === 'home') {
          date = 0;
        } else if (key === 'end') {
          date = 11;
        }
        ctrl.activeDate.setMonth(date);
      };

      ctrl.refreshView();
    }
  };
}])

.directive('persianYearpicker', ['dateFilter','PersianDateService','persianDateFilter', function (dateFilter,PersianDateService,persianDateFilter) {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'template/persianDatepicker/year.html',
    require: '^persianDatepicker',
    link: function(scope, element, attrs, ctrl) {
      var range = ctrl.yearRange;

      ctrl.step = { years: range };
      ctrl.element = element;

      function getStartingYear( year ) {
        return parseInt((year - 1) / range, 10) * range + 1;
      }

      ctrl._refreshView = function() {
        var years = new Array(range);

        //for ( var i = 0, start = getStartingYear(ctrl.activeDate.getFullYear()); i < range; i++ ) {
		for ( var i = 0, start = getStartingYear(PersianDateService.getFullYear(ctrl.activeDate)); i < range; i++ ) {
		
          //years[i] = angular.extend(ctrl.createDateObject(new Date(start + i, 0, 1), ctrl.formatYear), {
		  years[i] = angular.extend(ctrl.createDateObject(PersianDateService.persian_to_gregorian_Date(start + i, 0, 1), ctrl.formatYear), {
		  
            uid: scope.uniqueId + '-' + i
          });
        }

        scope.title = [years[0].label, years[range - 1].label].join(' - ');
        scope.rows = ctrl.split(years, 5);
      };

      ctrl.compare = function(date1, date2) {
        return date1.getFullYear() - date2.getFullYear();
      };

      ctrl.handleKeyDown = function( key, evt ) {
        var date = ctrl.activeDate.getFullYear();

        if (key === 'left') {
          date = date - 1;   // up
        } else if (key === 'up') {
          date = date - 5;   // down
        } else if (key === 'right') {
          date = date + 1;   // down
        } else if (key === 'down') {
          date = date + 5;
        } else if (key === 'pageup' || key === 'pagedown') {
          date += (key === 'pageup' ? - 1 : 1) * ctrl.step.years;
        } else if (key === 'home') {
          date = getStartingYear( ctrl.activeDate.getFullYear() );
        } else if (key === 'end') {
          date = getStartingYear( ctrl.activeDate.getFullYear() ) + range - 1;
        }
        ctrl.activeDate.setFullYear(date);
      };

      ctrl.refreshView();
    }
  };
}])

.constant('datepickerPopupConfig', {
  datepickerPopupPersian: 'yyyy-MM-dd',
  currentText: 'Today',
  html5Types: {
    date: 'yyyy-MM-dd',
    'datetime-local': 'yyyy-MM-ddTHH:mm:ss.sss',
    'month': 'yyyy-MM'
  },
  clearText: 'Clear',
  closeText: 'Done',
  closeOnDateSelection: true,
  appendToBody: false,
  showButtonBar: true
})

.directive('datepickerPopupPersian', ['$compile', '$parse', '$document', '$position', 'dateFilter', 'dateParser', 'datepickerPopupConfig','PersianDateService','persianDateFilter','EnToFaNumberFilter',
function ($compile, $parse, $document, $position, dateFilter, dateParser, datepickerPopupConfig, PersianDateService, persianDateFilter,EnToFaNumberFilter) {
  return {
    restrict: 'EA',
    require: 'ngModel',
    scope: {
      isOpen: '=?',
      currentText: '@',
      clearText: '@',
      closeText: '@',
      dateDisabled: '&'
    },
    link: function(scope, element, attrs, ngModel) {
      var dateFormat,
          closeOnDateSelection = angular.isDefined(attrs.closeOnDateSelection) ? scope.$parent.$eval(attrs.closeOnDateSelection) : datepickerPopupConfig.closeOnDateSelection,
          appendToBody = angular.isDefined(attrs.datepickerAppendToBody) ? scope.$parent.$eval(attrs.datepickerAppendToBody) : datepickerPopupConfig.appendToBody;
           dateFormat = attrs.datepickerPopupPersian || datepickerPopupConfig.datepickerPopupPersian;

      scope.showButtonBar = angular.isDefined(attrs.showButtonBar) ? scope.$parent.$eval(attrs.showButtonBar) : datepickerPopupConfig.showButtonBar;

      scope.getText = function( key ) {
        return scope[key + 'Text'] || datepickerPopupConfig[key + 'Text'];
      };

      attrs.$observe('datepickerPopupPersian', function(value) {
          dateFormat = value || datepickerPopupConfig.datepickerPopupPersian;
          ngModel.$render();
      });

      // popup element used to display calendar
      var popupEl = angular.element('<div persian-datepicker-popup-wrap><div persian-datepicker></div></div>');
      popupEl.attr({
        'ng-model': 'date',
        'ng-change': 'dateSelection()'
      });

      function cameltoDash( string ){
        return string.replace(/([A-Z])/g, function($1) { return '-' + $1.toLowerCase(); });
      }

      // datepicker element
      var datepickerEl = angular.element(popupEl.children()[0]);
      if ( attrs.datepickerOptions ) {
        angular.forEach(scope.$parent.$eval(attrs.datepickerOptions), function( value, option ) {
          datepickerEl.attr( cameltoDash(option), value );
        });
      }

      scope.watchData = {};
      angular.forEach(['minDate', 'maxDate', 'datepickerMode'], function( key ) {
        if ( attrs[key] ) {
          var getAttribute = $parse(attrs[key]);
          scope.$parent.$watch(getAttribute, function(value){
            scope.watchData[key] = value;
          });
          datepickerEl.attr(cameltoDash(key), 'watchData.' + key);

          // Propagate changes from datepicker to outside
          if ( key === 'datepickerMode' ) {
            var setAttribute = getAttribute.assign;
            scope.$watch('watchData.' + key, function(value, oldvalue) {
              if ( value !== oldvalue ) {
                setAttribute(scope.$parent, value);
              }
            });
          }
        }
      });
      if (attrs.dateDisabled) {
        datepickerEl.attr('date-disabled', 'dateDisabled({ date: date, mode: mode })');
      }

      function parseDate(viewValue) {
        if (!viewValue) {
          ngModel.$setValidity('date', true);
          return null;
        } else if (angular.isDate(viewValue) && !isNaN(viewValue)) {
          ngModel.$setValidity('date', true);
          return viewValue;
        } else if (angular.isString(viewValue)) {
          var date = dateParser.parse(viewValue, dateFormat) || new Date(viewValue);
          if (isNaN(date)) {
            ngModel.$setValidity('date', false);
            return undefined;
          } else {
            ngModel.$setValidity('date', true);
            return date;
          }
        } else {
          ngModel.$setValidity('date', false);
          return undefined;
        }
      }
      ngModel.$parsers.unshift(parseDate);
	ngModel.$formatters.push(function (value) {
    	  return ngModel.$isEmpty(value) ? value : persianDateFilter(value, dateFormat);
    	});
      // Inner change
      scope.dateSelection = function(dt) {
        if (angular.isDefined(dt)) {
          scope.date = dt;
        }
        ngModel.$setViewValue(scope.date);
        ngModel.$render();

        if ( closeOnDateSelection ) {
          scope.isOpen = false;
          element[0].focus();
        }
      };

      element.bind('input change keyup', function() {
        scope.$apply(function() {
          scope.date = ngModel.$modelValue;
        });
      });

      // Outter change
      ngModel.$render = function() {
	  
        //var date = ngModel.$viewValue ? dateFilter(ngModel.$viewValue, dateFormat) : '';
		var date = ngModel.$viewValue ? EnToFaNumberFilter(persianDateFilter(ngModel.$viewValue, dateFormat)) : '';
		
        element.val(date);
        scope.date = parseDate( ngModel.$modelValue );
      };

      var documentClickBind = function(event) {
        if (scope.isOpen && event.target !== element[0]) {
          scope.$apply(function() {
            scope.isOpen = false;
          });
        }
      };

      var keydown = function(evt, noApply) {
        scope.keydown(evt);
      };
      element.bind('keydown', keydown);

      scope.keydown = function(evt) {
        if (evt.which === 27) {
          evt.preventDefault();
          evt.stopPropagation();
          scope.close();
        } else if (evt.which === 40 && !scope.isOpen) {
          scope.isOpen = true;
        }
      };

      scope.$watch('isOpen', function(value) {
        if (value) {
          scope.$broadcast('datepicker.focus');
          scope.position = appendToBody ? $position.offset(element) : $position.position(element);
          scope.position.top = scope.position.top + element.prop('offsetHeight');

          $document.bind('click', documentClickBind);
        } else {
          $document.unbind('click', documentClickBind);
        }
      });

      scope.select = function( date ) {
        if (date === 'today') {
          var today = new Date();
          if (angular.isDate(ngModel.$modelValue)) {
            date = new Date(ngModel.$modelValue);
            date.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
          } else {
            date = new Date(today.setHours(0, 0, 0, 0));
          }
        }
        scope.dateSelection( date );
      };

      scope.close = function() {
        scope.isOpen = false;
        element[0].focus();
      };

      var $popup = $compile(popupEl)(scope);
      if ( appendToBody ) {
        $document.find('body').append($popup);
      } else {
        element.after($popup);
      }

      scope.$on('$destroy', function() {
        $popup.remove();
        element.unbind('keydown', keydown);
        $document.unbind('click', documentClickBind);
      });
    }
  };
}])

.directive('persianDatepickerPopupWrap', function() {
  return {
    restrict:'EA',
    replace: true,
    transclude: true,
    templateUrl: 'template/persianDatepicker/popup.html',
    link:function (scope, element, attrs) {
      element.bind('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    }
  };
});
angular.module("template/persianDatepicker/datepicker.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/persianDatepicker/datepicker.html",
    "<div ng-switch=\"datepickerMode\" role=\"application\" ng-keydown=\"keydown($event)\">\n" +
    "  <persian-daypicker ng-switch-when=\"day\" tabindex=\"0\"></persian-daypicker>\n" +
    "  <persian-monthpicker ng-switch-when=\"month\" tabindex=\"0\"></persian-monthpicker>\n" +
    "  <persian-yearpicker ng-switch-when=\"year\" tabindex=\"0\"></persian-yearpicker>\n" +
    "</div>");
}]);

angular.module("template/persianDatepicker/day.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/persianDatepicker/day.html",
    "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
    "      <th colspan=\"{{5 + showWeeks}}\"><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title|EnToFaNumber}}</strong></button></th>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <th ng-show=\"showWeeks\" class=\"text-center\"></th>\n" +
    "      <th ng-repeat=\"label in labels track by $index\" class=\"text-center\"><small aria-label=\"{{label.full}}\">{{label.abbr}}</small></th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "    <tr ng-repeat=\"row in rows track by $index\">\n" +
    "      <td ng-show=\"showWeeks\" class=\"text-center h6\"><em>{{ weekNumbers[$index] |EnToFaNumber }}</em></td>\n" +
    "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
    "        <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default btn-sm\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'text-muted': dt.secondary, 'text-info': dt.current}\">{{dt.label|EnToFaNumber}}</span></button>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("template/persianDatepicker/month.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/persianDatepicker/month.html",
    "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
    "      <th><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title|EnToFaNumber}}</strong></button></th>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "    <tr ng-repeat=\"row in rows track by $index\">\n" +
    "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
    "        <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'text-info': dt.current}\">{{dt.label}}</span></button>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("template/persianDatepicker/popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/persianDatepicker/popup.html",
    "<ul style=\"direction:ltr;\" class=\"dropdown-menu\" ng-style=\"{display: (isOpen && 'block') || 'none', top: position.top+'px', left: position.left+'px'}\" ng-keydown=\"keydown($event)\">\n" +
    "	<li ng-transclude></li>\n" +
    "	<li ng-if=\"showButtonBar\" style=\"padding:10px 9px 2px\">\n" +
    "		<span class=\"btn-group\">\n" +
    "			<button type=\"button\" class=\"btn btn-sm btn-info\" ng-click=\"select('today')\">{{ getText('current') }}</button>\n" +
    "			<button type=\"button\" class=\"btn btn-sm btn-danger\" ng-click=\"select(null)\">{{ getText('clear') }}</button>\n" +
    "		</span>\n" +
    "		<button type=\"button\" class=\"btn btn-sm btn-success pull-right\" ng-click=\"close()\">{{ getText('close') }}</button>\n" +
    "	</li>\n" +
    "</ul>\n" +
    "");
}]);

angular.module("template/persianDatepicker/year.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/persianDatepicker/year.html",
    "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
    "      <th colspan=\"3\"><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title|EnToFaNumber}}</strong></button></th>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "    <tr ng-repeat=\"row in rows track by $index\">\n" +
    "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
    "        <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'text-info': dt.current}\">{{dt.label|EnToFaNumber}}</span></button>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module('persianDate', [])
    .filter('persianDate', function ($locale,PersianDateService) {
		function int(str) {
		  return parseInt(str, 10);
		}
       var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
                     // 1        2       3         4          5          6          7          8  9     10      11
		function padNumber(num, digits, trim) {
		  var neg = '';
		  if (num < 0) {
			neg =  '-';
			num = -num;
		  }
		  num = '' + num;
		  while(num.length < digits) num = '0' + num;
		  if (trim)
			num = num.substr(num.length - digits);
		  return neg + num;
		}


		function dateGetter(name, size, offset, trim) {
		  offset = offset || 0;
		  return function(date) {

			//var value = date['get' + name]();
			var value = PersianDateService['get' + name](date);

			if (offset > 0 || value > -offset)
			  value += offset;
			if (value === 0 && offset == -12 ) value = 12;
			return padNumber(value, size, trim);
		  };
		}

		function dateStrGetter(name, shortForm) {
		  return function(date, formats) {

			//var value = date['get' + name]();
			var value = PersianDateService['get' + name](date);
			
			var get = angular.uppercase(shortForm ? ('SHORT' + name) : name);

			return formats[get][value];
		  };
		}

		function timeZoneGetter(date) {
		  var zone = -1 * date.getTimezoneOffset();
		  var paddedZone = (zone >= 0) ? "+" : "";

		  paddedZone += padNumber(Math[zone > 0 ? 'floor' : 'ceil'](zone / 60), 2) +
						padNumber(Math.abs(zone % 60), 2);

		  return paddedZone;
		}

		function ampmGetter(date, formats) {
		
		  return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
		}
		
		function concat(array1, array2, index) {
			var slice = [].slice;
		  return array1.concat(slice.call(array2, index));
		}
		var DATE_FORMATS = {
		  yyyy: dateGetter('FullYear', 4),
			yy: dateGetter('FullYear', 2, 0, true),
			 y: dateGetter('FullYear', 1),
		  MMMM: dateStrGetter('Month'),
		   MMM: dateStrGetter('Month', true),
			MM: dateGetter('Month', 2, 1),
			 M: dateGetter('Month', 1, 1),
			dd: dateGetter('Date', 2),
			 d: dateGetter('Date', 1),
			HH: dateGetter('Hours', 2),
			 H: dateGetter('Hours', 1),
			hh: dateGetter('Hours', 2, -12),
			 h: dateGetter('Hours', 1, -12),
			mm: dateGetter('Minutes', 2),
			 m: dateGetter('Minutes', 1),
			ss: dateGetter('Seconds', 2),
			 s: dateGetter('Seconds', 1),
			 // while ISO 8601 requires fractions to be prefixed with `.` or `,`
			 // we can be just safely rely on using `sss` since we currently don't support single or two digit fractions
		   sss: dateGetter('Milliseconds', 3),
		  EEEE: dateStrGetter('Day'),
		   EEE: dateStrGetter('Day', true),
			 a: ampmGetter,
			 Z: timeZoneGetter
		};
		
		var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,
			NUMBER_STRING = /^\-?\d+$/;
		function jsonStringToDate(string) {
    var match;
    if (match = string.match(R_ISO8601_STR)) {
      var date = new Date(0),
          tzHour = 0,
          tzMin  = 0,
          dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
          timeSetter = match[8] ? date.setUTCHours : date.setHours;

      if (match[9]) {
        tzHour = int(match[9] + match[10]);
        tzMin = int(match[9] + match[11]);
      }
      dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
      var h = int(match[4]||0) - tzHour;
      var m = int(match[5]||0) - tzMin;
      var s = int(match[6]||0);
      var ms = Math.round(parseFloat('0.' + (match[7]||0)) * 1000);
      timeSetter.call(date, h, m, s, ms);
      return date;
    }
    return string;
  }

		return function(date, format) {
			var text = '',
				parts = [],
				fn, match;

			format = format || 'mediumDate';
			format = $locale.DATETIME_FORMATS[format] || format;
			if (angular.isString(date)) {
			  if (NUMBER_STRING.test(date)) {
				date = int(date);
			  } else {
				date = jsonStringToDate(date);
			  }
			}

			if (angular.isNumber(date)) {
			  date = new Date(date);
			}

			if (!angular.isDate(date)) {
			  return date;
			}

			while(format) {
			  match = DATE_FORMATS_SPLIT.exec(format);
			  if (match) {
				parts = concat(parts, match, 1);
				format = parts.pop();
			  } else {
				parts.push(format);
				format = null;
			  }
			}

			angular.forEach(parts, function(value){
			  fn = DATE_FORMATS[value];
			  
			  
		
			  
			  text += fn ? fn(date, {
        MONTH:
            'فروردین,اردیبهشت,خرداد,تیر,مرداد,شهریور,مهر,آبان,آذر,دی,بهمن,اسفند'
            .split(','),
        SHORTMONTH:  'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
        DAY: 'یک شنبه,دوشنبه,سه شنبه,چهارشنبه,پنج شنبه,جمعه,شنبه'.split(','),
        SHORTDAY: 'ی,د,س,چ,پ,ج,ش'.split(','),
        AMPMS: ['AM','PM'],
        medium: 'MMM d, y h:mm:ss a',
        short: 'M/d/yy h:mm a',
        fullDate: 'EEEE, MMMM d, y',
        longDate: 'MMMM d, y',
        mediumDate: 'MMM d, y',
        shortDate: 'M/d/yy',
        mediumTime: 'h:mm:ss a',
        shortTime: 'h:mm a'
      }) : value.replace(/(^'|'$)/g, '').replace(/''/g, "'");
			  //text += fn ? fn(date, $locale.DATETIME_FORMATS) : value.replace(/(^'|'$)/g, '').replace(/''/g, "'");
			});

			return text;
		};
    })
	.service('PersianDateService', function() {
		if (typeof fdef !== 'function') {
		var fdef = function (f) {
			return (typeof f === 'function');
		};
	}
	 this.isPersianDate=function(input) {
    var parts, tmp;

    if (input.search(/^\d+\-\d+\-\d+$/) == 0) {
        parts = input.split("-", 3);
    } else if (input.search(/^\d+\/\d+\/\d+$/) == 0) {
        parts = input.split('/', 3);
    } else if (input.search(/^\d{6}|\d{8}$/) == 0) {
        parts = [
        input.substr(0, input.length - 4),
        input.substr(input.length - 4, 2),
        input.substr(input.length - 2, 2)];
    } else if (
    (parts = input.match(/^(\d{2})(\d{2})$/)) || // 1234
    (parts = input.match(/^(\d{1,2})[/\-](\d{1,2})$/)) || // 1/2, 12/34, 1/23, 12/3 both with '/' and "-"
    (parts = input.match(/^(\d{1,2})$/)) // 1, 12
    ) {
        var curPDate = new Date();
        curPDate = gregorian_to_jd(curPDate.getFullYear(), curPDate.getMonth() + 1, curPDate.getDate());
        curPDate = jd_to_persian(curPDate);

        // set year
        parts[0] = curPDate[0];

        // single digit date is assumed to be day of current month
        // the position will be swapped in next step...
        if (typeof parts[2] == "undefined") parts[2] = curPDate[1];

        // swap month and day
        if (parseInt(parts[2], 10) <= 12) {
            tmp = parts[1];
            parts[1] = parts[2];
            parts[2] = tmp;
        }

    } else {
        return false;
    }

    for (var i = 0; i <= 2; ++i)
    parts[i] = parseInt(parts[i], 10);

    // --- month ---
    if (parts[1] > 12 || parts[1] <= 0) return false;

    // replace the day and year if position is incorrect
    if (parts[2] > persianMonthDays(longYear(parts[0]), parts[1] - 1)) {
        tmp = parts[2];
        parts[2] = parts[0];
        parts[0] = tmp;
    }

    // --- year ---
    // --- it's enough ! ---
    if (parts[0] > 9999) return false;

    if (parts[0] < 100) parts[0] = longYear(parts[0]);

    // day
    if (parts[2] === 0 || parts[2] > persianMonthDays(parts[0], parts[1] - 1)) return false;

    return parts;
};

// Converts two digit year to four digit
 var longYear=function(yr) {
    var curPDate, curCentury;

    if (yr >= 100) return yr;

    curPDate = new Date();
    curPDate = gregorian_to_jd(curPDate.getFullYear(), curPDate.getMonth() + 1, curPDate.getDate());
    curPDate = jd_to_persian(curPDate);
    curCentury = Math.floor(curPDate[0] / 100) * 100;

    if (Math.abs(curPDate[0] - curCentury - yr) > 70) curCentury = curCentury + 100;

    return curCentury + yr;
};

var GREGORIAN_EPOCH = 1721425.5,
    PERSIAN_EPOCH = 1948320.5;

if (!fdef(mod)) {
    var mod = function (a, b) {
        return a - (b * Math.floor(a / b));
    };
};

 var leap_persian=function(year) {
    return (
    (((((year - ((year > 0) ? 474 : 473)) % 2820) + 474) + 38) * 682) % 2816) < 682;
};

 var jd_to_persian=function(jd) {
    var year, month, day, depoch, cycle, cyear, ycycle, aux1, aux2, yday;

    jd = Math.floor(jd) + 0.5;

    depoch = jd - persian_to_jd(475, 1, 1);
    cycle = Math.floor(depoch / 1029983);
    cyear = mod(depoch, 1029983);
    if (cyear == 1029982) {
        ycycle = 2820;
    } else {
        aux1 = Math.floor(cyear / 366);
        aux2 = mod(cyear, 366);
        ycycle = Math.floor(((2134 * aux1) + (2816 * aux2) + 2815) / 1028522) + aux1 + 1;
    }
    year = ycycle + (2820 * cycle) + 474;
    if (year <= 0) {
        year--;
    }
    yday = (jd - persian_to_jd(year, 1, 1)) + 1;
    month = (yday <= 186) ? Math.ceil(yday / 31) : Math.ceil((yday - 6) / 30);
    day = (jd - persian_to_jd(year, month, 1)) + 1;
    return new Array(year, month, day);
}
;
var  persian_to_jd=function(year, month, day) {
    var epbase, epyear;

    epbase = year - ((year >= 0) ? 474 : 473);
    epyear = 474 + mod(epbase, 2820);

    return day + ((month <= 7) ? ((month - 1) * 31) : (((month - 1) * 30) + 6)) + Math.floor(((epyear * 682) - 110) / 2816) + (epyear - 1) * 365 + Math.floor(epbase / 2820) * 1029983 + (PERSIAN_EPOCH - 1);
};

var  leap_gregorian=function(year) {
    return ((year % 4) == 0) && (!(((year % 100) == 0) && ((year % 400) != 0)));
};

var jd_to_gregorian=function(jd) {
    var wjd, depoch, quadricent, dqc, cent, dcent, quad, dquad, yindex, year, month, day, yearday, leapadj;

    wjd = Math.floor(jd - 0.5) + 0.5;
    depoch = wjd - GREGORIAN_EPOCH;
    quadricent = Math.floor(depoch / 146097);
    dqc = mod(depoch, 146097);
    cent = Math.floor(dqc / 36524);
    dcent = mod(dqc, 36524);
    quad = Math.floor(dcent / 1461);
    dquad = mod(dcent, 1461);
    yindex = Math.floor(dquad / 365);
    year = (quadricent * 400) + (cent * 100) + (quad * 4) + yindex;
    if (!((cent == 4) || (yindex == 4))) {
        year++;
    }
    yearday = wjd - gregorian_to_jd(year, 1, 1);
    leapadj = (
    (wjd < gregorian_to_jd(year, 3, 1)) ? 0 : (leap_gregorian(year) ? 1 : 2));
    month = Math.floor((((yearday + leapadj) * 12) + 373) / 367);
    day = (wjd - gregorian_to_jd(year, month, 1)) + 1;

    return new Array(year, month, day);
};

var  gregorian_to_jd=function(year, month, day) {
    return (GREGORIAN_EPOCH - 1) + (365 * (year - 1)) + Math.floor((year - 1) / 4) + (-Math.floor((year - 1) / 100)) + Math.floor((year - 1) / 400) + Math.floor(
    (((367 * month) - 362) / 12) + (
    (month <= 2) ? 0 : (leap_gregorian(year) ? -1 : -2)) + day);
};

var gregorian_to_persian=function(year, month, day){
	return jd_to_persian(gregorian_to_jd(year, month, day));
};

this.getFullYear = function(date){
	var persianDate = this.gregorianDate_to_persianDateArray(date);
	return persianDate[0];
};
this.getMonth = function(date){
	var persianDate = this.gregorianDate_to_persianDateArray(date);
	return persianDate[1];
};
this.getDay = function(date){
	return date.getDay();
};
this.getDate = function(date){
	var persianDate = this.gregorianDate_to_persianDateArray(date);
	return persianDate[2];
};
this.gregorianDate_to_persianDateArray = function(date){
	var persianDate = gregorian_to_persian(date.getFullYear(),date.getMonth() + 1,date.getDate());
	--persianDate[1];
	return persianDate;
};
var persian_to_gregorian=function(year, month, day){
	return jd_to_gregorian(persian_to_jd(year, month, day));
};
this.persian_to_gregorian_Date = function(year, month, day){
	month=month + 1;
	if(month>12){
		year +=Math.floor(month / 12);
		month=month%12 || 12;
	}else if(month<1 && month>-12){
		if(month===0){
			year-=1;
		}else{
			year +=Math.floor((month / 12));
		}
		month+=12;
	}
	var greg = jd_to_gregorian(persian_to_jd(year, month, day));
	return new Date(greg[0],greg[1] - 1,greg[2]);
};
this.persianMonthDays=function(year, month) {
    return (
    month <= 5 ? 31 : (
    month <= 10 ? 30 : (
    month == 11 ? (leap_persian(year) ? 30 : 29) : 0)));
};

if (!fdef(stopPropagation)) {
    var stopPropagation = function (evt) {

        if (evt.stopPropagation) {
            evt.stopPropagation();
        } else {
            evt.cancelBubble = true;
        }

    };
};

if (!fdef(preventDefault)) {
    var preventDefault = function (evt) {

        if (evt.preventDefault) {
            evt.preventDefault();
        } else {
            evt.returnValue = false;
        }

    };
};

if (!fdef(faDigitsToEn)) {
    var faDigitsToEn = function (input) {
        var inputLength = input.length,
            strOutput = '',
            i = 0;

        for (i = 0; i < inputLength; ++i) {

            strOutput += String.fromCharCode(
            input.charCodeAt(i) >= 1776 && input.charCodeAt(i) <= 1785 ? input.charCodeAt(i) - 1728 : input.charCodeAt(i))

        }

        return strOutput;
    };
};

if (!fdef(enDigitsToFa)) {
    var enDigitsToFa = function (input) {
        input = input.toString();

        var inputLength = input.length,
            strOutput = '',
            i = 0;

        for (i = 0; i < inputLength; ++i) {

            strOutput += String.fromCharCode(
            input.charCodeAt(i) >= 48 && input.charCodeAt(i) <= 57 ? input.charCodeAt(i) + 1728 : input.charCodeAt(i))

        }

        return strOutput;
    };
};

if (!('trim' in String.prototype)) {
    String.prototype.trim = function () {
        return this.replace(/^\s*/, '').replace(/\s*$/, '');
    }
};

if (!('map' in Array.prototype)) {
    Array.prototype.map = function (mapper, that /*opt*/ ) {
        var other = new Array(this.length);

        for (var i = 0, n = this.length; i < n; i++)

        if (i in this) other[i] = mapper.call(that, this[i], i, this);

        return other;
    };
};
	});
	
 
angular.module('ui.bootstrap.position', [])

/**
 * A set of utility methods that can be use to retrieve position of DOM elements.
 * It is meant to be used where we need to absolute-position DOM elements in
 * relation to other, existing elements (this is the case for tooltips, popovers,
 * typeahead suggestions etc.).
 */
  .factory('$position', ['$document', '$window', function ($document, $window) {

    function getStyle(el, cssprop) {
      if (el.currentStyle) { //IE
        return el.currentStyle[cssprop];
      } else if ($window.getComputedStyle) {
        return $window.getComputedStyle(el)[cssprop];
      }
      // finally try and get inline style
      return el.style[cssprop];
    }

    /**
     * Checks if a given element is statically positioned
     * @param element - raw DOM element
     */
    function isStaticPositioned(element) {
      return (getStyle(element, 'position') || 'static' ) === 'static';
    }

    /**
     * returns the closest, non-statically positioned parentOffset of a given element
     * @param element
     */
    var parentOffsetEl = function (element) {
      var docDomEl = $document[0];
      var offsetParent = element.offsetParent || docDomEl;
      while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent) ) {
        offsetParent = offsetParent.offsetParent;
      }
      return offsetParent || docDomEl;
    };

    return {
      /**
       * Provides read-only equivalent of jQuery's position function:
       * http://api.jquery.com/position/
       */
      position: function (element) {
        var elBCR = this.offset(element);
        var offsetParentBCR = { top: 0, left: 0 };
        var offsetParentEl = parentOffsetEl(element[0]);
        if (offsetParentEl != $document[0]) {
          offsetParentBCR = this.offset(angular.element(offsetParentEl));
          offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
          offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
        }

        var boundingClientRect = element[0].getBoundingClientRect();
        return {
          width: boundingClientRect.width || element.prop('offsetWidth'),
          height: boundingClientRect.height || element.prop('offsetHeight'),
          top: elBCR.top - offsetParentBCR.top,
          left: elBCR.left - offsetParentBCR.left
        };
      },

      /**
       * Provides read-only equivalent of jQuery's offset function:
       * http://api.jquery.com/offset/
       */
      offset: function (element) {
        var boundingClientRect = element[0].getBoundingClientRect();
        return {
          width: boundingClientRect.width || element.prop('offsetWidth'),
          height: boundingClientRect.height || element.prop('offsetHeight'),
          top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
          left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
        };
      },

      /**
       * Provides coordinates for the targetEl in relation to hostEl
       */
      positionElements: function (hostEl, targetEl, positionStr, appendToBody) {

        var positionStrParts = positionStr.split('-');
        var pos0 = positionStrParts[0], pos1 = positionStrParts[1] || 'center';

        var hostElPos,
          targetElWidth,
          targetElHeight,
          targetElPos;

        hostElPos = appendToBody ? this.offset(hostEl) : this.position(hostEl);

        targetElWidth = targetEl.prop('offsetWidth');
        targetElHeight = targetEl.prop('offsetHeight');

        var shiftWidth = {
          center: function () {
            return hostElPos.left + hostElPos.width / 2 - targetElWidth / 2;
          },
          left: function () {
            return hostElPos.left;
          },
          right: function () {
            return hostElPos.left + hostElPos.width;
          }
        };

        var shiftHeight = {
          center: function () {
            return hostElPos.top + hostElPos.height / 2 - targetElHeight / 2;
          },
          top: function () {
            return hostElPos.top;
          },
          bottom: function () {
            return hostElPos.top + hostElPos.height;
          }
        };

        switch (pos0) {
          case 'right':
            targetElPos = {
              top: shiftHeight[pos1](),
              left: shiftWidth[pos0]()
            };
            break;
          case 'left':
            targetElPos = {
              top: shiftHeight[pos1](),
              left: hostElPos.left - targetElWidth
            };
            break;
          case 'bottom':
            targetElPos = {
              top: shiftHeight[pos0](),
              left: shiftWidth[pos1]()
            };
            break;
          default:
            targetElPos = {
              top: hostElPos.top - targetElHeight,
              left: shiftWidth[pos1]()
            };
            break;
        }

        return targetElPos;
      }
    };
  }]);
