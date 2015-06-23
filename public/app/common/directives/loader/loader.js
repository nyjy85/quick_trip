app.directive('loader', function ($compile) {
    return {
        restrict: 'E',
        template: '<img src="/app/common/directives/loader/plane2.gif" />'
    };
});
