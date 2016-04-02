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
  // we don't need a controller for this component
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

  // holds the currently filtered values
  // of the table
  ctrl.filters = [];

  // in order to display a meaningful title
  // in the table header we need a
  // name for the dimension
  ctrl.dimension_name = data.key;

  // creates a crossfilter dimension out of the
  // function
  // the function is run for every data point in the
  // crossfilter
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

    // when we only have a single filter we can use
    // filterExact
    if (ctrl.filters.length === 1) {
      ctrl.dimension.filterExact(ctrl.filters[0]);
    // with more filters we need to manually specify which items
    // are filtered and which are not
    } else if (ctrl.filters.length > 1) {
      ctrl.dimension.filterFunction(function(d){
        return ctrl.filters.indexOf(d) !== -1;
      });
    // with no filters we remove the filter by filtering null
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
        // check if we have filters
        // if so we need to add a contextual
        // css class to the table row
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

// the script is in the head tag so we need to wait for the browser
// to create the body element before continuing
window.onload = function() {
  m.mount(document.body, topComponent);
};
