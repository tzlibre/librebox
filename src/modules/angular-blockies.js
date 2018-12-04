import angular from 'angular'
import blockies from 'ethereum-blockies'

angular.module('angular-blockies', [])
  .directive('blocky', ['$compile', function ($compile) {
    function link (scope, element, attrs) {
      function buildBlock () {
        const icon = blockies.create({
          seed: attrs.seed,
          size: attrs.size,
          scale: attrs.scale,
          spotcolor: '#000'
        })
        const compiled = $compile(icon)(scope)
        element.replaceWith(compiled)
        element = compiled
      }
      scope.$watch(function () {
        return [attrs.seed, attrs.color, attrs.bgcolor, attrs.size, attrs.scale]
      }, buildBlock, true)
    }

    return {
      restrict: 'EA',
      replace: false,
      link: link
    }
  }])

export default 'angular-blockies'
