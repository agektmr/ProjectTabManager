app.config(function($routeProvider) {
  $routeProvider.
    when('/options', {
      templateUrl: 'options.html',
      controller: 'OptionsCtrl'
    }).
    when('/summary', {
      templateUrl: 'summary.html',
      controller: 'SummaryCtrl'
    }).
    when('/help', {
      templateUrl: 'help.html',
      controller: 'HelpCtrl'
    }).
    otherwise({
      templateUrl: 'options.html',
      controller: 'OptionsCtrl'
    });
});