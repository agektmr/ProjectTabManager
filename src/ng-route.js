app.config(function($routeProvider) {
  $routeProvider.
    when('/options', {
      templateUrl: 'partials/options.html',
      controller: 'OptionsCtrl'
    }).
    when('/summary', {
      templateUrl: 'partials/summary.html',
      controller: 'SummaryCtrl'
    }).
    when('/help', {
      templateUrl: 'partials/help.html'
    }).
    when('/history', {
      templateUrl: 'partials/HISTORY.html'
    }).
    otherwise({
      templateUrl: 'partials/options.html',
      controller: 'OptionsCtrl'
    });
});