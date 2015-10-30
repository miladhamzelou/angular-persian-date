# angular-persian-date

# Angular App:
var app = angular.module('app',['ui.bootstrap.persian.datepicker']);


# Main Controller:

app.controller("MainController", function($scope){

	
	$scope.today = function() {
    $scope.dt = new Date();
  };
  $scope.today();

  $scope.clear = function () {
    $scope.dt = null;
  };

  // Disable weekend selection
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' &&date.getDay() === 5  );
  };

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };
  $scope.toggleMin();

  $scope.openPersian = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.persianIsOpen = true;
    $scope.gregorianIsOpen = false;
  };
  $scope.openGregorian = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.gregorianIsOpen = true;
    $scope.persianIsOpen = false;
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 6
  };

  $scope.initDate = new Date('2016-15-20');
  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];
  });


# in Template

	<pre>Selected date is: <em>{{dt | date:'fullDate' }}</em></pre>

	<pre style="direction: rtl;">تاریخ انتخاب شده: <em>{{dt | persianDate:'fullDate' }}</em></pre>

    <persian-datepicker ng-model="dt" min-date="minDate" show-weeks="true" class="well well-sm" starting-day="6"></persian-datepicker>


	#Inline

	    <div style="display:inline-block; min-height:290px;">
	        <persian-datepicker ng-model="dt" min-date="minDate" show-weeks="true" class="well well-sm" starting-day="6"></persian-datepicker>
	    </div>

	#Popup

	    <div class="row">
	        <div class="col-md-6">
	            <p class="input-group">
	              <input type="text" class="form-control" datepicker-popup-persian="{{format}}" ng-model="dt" is-open="persianIsOpen" datepicker-options="dateOptions" date-disabled="disabled(date, mode)" ng-required="true" close-text="بسته">
	               <span class="input-group-btn">
	                <button type="button" class="btn btn-default" ng-click="openPersian($event)"><i class="glyphicon glyphicon-calendar"></i></button>
	              </span> 
	            </p>
				
				
				<p class="input-group">
	              <input type="text" class="form-control" datepicker-popup="{{format}}" ng-model="dt" is-open="gregorianIsOpen" datepicker-options="dateOptions" date-disabled="disabled(date, mode)" ng-required="true" close-text="بسته">
	               <span class="input-group-btn">
	                <button type="button" class="btn btn-default" ng-click="openGregorian($event)"><i class="glyphicon glyphicon-calendar"></i></button>
	              </span> 
	            </p>
	        </div>
	    </div>
	    <div class="row">
	        <div class="col-md-6">
	            <label>Format:</label> <select class="form-control" ng-model="format" ng-options="f for f in formats"><option></option></select>
	        </div>
	    </div>


    <button type="button" class="btn btn-sm btn-info" ng-click="today()">Today</button>
    <button type="button" class="btn btn-sm btn-default" ng-click="dt = &#39;2009-08-24&#39;">2009-08-24</button>
    <button type="button" class="btn btn-sm btn-danger" ng-click="clear()">Clear</button>
    <button type="button" class="btn btn-sm btn-default" ng-click="toggleMin()" tooltip="After today restriction">Min date</button>
