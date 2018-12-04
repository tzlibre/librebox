import angular from 'angular'

angular.module('angular-tooltip', [])
  .directive('tooltip', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.hover(function () {
          element.tooltip('show')
        }, function () {
          element.tooltip('hide')
        })
      }
    }
  })

export default 'angular-tooltip'
