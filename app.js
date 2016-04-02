// initializes an empty crossfilter
var cf = crossfilter([]);

var names = ['Einar', 'Stefán', 'Gísli', 'Eiríkur', 'Helgi'];
var locations = ['Denmark', 'Sweden', 'Norway', 'Iceland', 'United States', 'United Kingdom'];

function generateRow() {
  return {
    name: names[Math.floor(Math.random() * names.length)],
    location: locations[Math.floor(Math.random() * locations.length)]
  };
}

window.setInterval(function(){
  cf.add([generateRow()]);
  // this is happening outside of mithrils auto redraw
  // so we need to manually call a redraw
  m.redraw();
}, 30);

var topComponent = {
  controller: function() {
    var ctrl = {};
    return ctrl;
  },
  view: function() {
    return m('', [
      m('h1.page-title', 'Filterable tables demo'),
      m.component(table, {key: 'name'}),
      m.component(table, {key: 'location'})
    ]);
  }
};

var table = {};
table.controller = function(data){
  var ctrl = {};

  ctrl.filters = [];
  ctrl.dimension_name = data.key;
  ctrl.dimension = cf.dimension(function(d){
    return d[data.key];
  });

  // inbuilt crossfilter count grouping
  // identical to:
  // group().reduce(
  //   function(p){return ++p;},
  //   function(p){return --p;},
  //   function(){return 0;}
  // );
  ctrl.group = ctrl.dimension.group().reduceCount();
  ctrl.onClick = function(d) {
    var index;
    if ((index = ctrl.filters.indexOf(d.key)) !== -1) {
      // remove from filter array
      ctrl.filters.splice(index, 1);
    } else {
      // add to filter array
      ctrl.filters.push(d.key);
    }

    if (ctrl.filters.length === 1) {
      ctrl.dimension.filterExact(ctrl.filters[0]);
    } else if (ctrl.filters.length > 1) {
      ctrl.dimension.filterFunction(function(d){
        return ctrl.filters.indexOf(d) !== -1;
      });
    } else {
      ctrl.dimension.filter(null);
    }
  };

  // when we stop displaying a table we remove it's dimension from play
  ctrl.onunload = function(){
    ctrl.dimension.dispose();
  };

  return ctrl;
};

table.view = function(ctrl){
  return m('table', [
    m('thead', m('tr', [
      m('th', ctrl.dimension_name),
      m('th', 'count')
    ])),
    m('tbody', [
      ctrl.group.all().map(function(d){
        var tdClick = {
          key: d.key,
          onclick: function() {
            ctrl.onClick(d);
          }
        };
        var trClass = '';
        if (ctrl.filters.length) {
          // selected
          if (ctrl.filters.indexOf(d.key) !== -1) {
            trClass = '.selected';
          } else {
            trClass = '.deselected';
          }
        }
        return m('tr' + trClass, [
          m('td', tdClick, d.key),
          m('td', tdClick, d.value)
        ]);
      })
    ])
  ]);
};

window.onload = function() {
m.mount(document.body, topComponent);
};
