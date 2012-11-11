app.config(function($routeProvider, $locationProvider) {
  $routeProvider.when('#options', {
    templateUrl: 'options.html',
    controller: OptionsCtrl
  });
  $routeProvider.when('#summary', {
    templateUrl: 'summary.html',
    controller: SummaryCtrl
  });
  $routeProvider.when('#help', {
    templateUrl: 'help.html',
    controller: HelpCtrl
  })
});