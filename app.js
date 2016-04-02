// initializes an empty crossfilter
var cf;

var names = ['Einar', 'Stefán', 'Gísli', 'Eiríkur', 'Helgi'];
var locations = ['Denmark', 'Sweden', 'Norway', 'Iceland', 'United States', 'United Kingdom'];


var rows = [];

for (var i = 0; i < 1000; ++i) {
  rows.push(generateRow());
}

cf = crossfilter(rows);
function generateRow() {
  return {
    name: names[Math.floor(Math.random() * names.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    count: 1
  };
}

// window.setInterval(function(){
//   cf.add([generateRow()]);
//   // this is happening outside of mithrils auto redraw
//   // so we need to manually call a redraw
//   m.redraw();
// }, 30);

var topComponent = {
  // we don't need a controller for this component
  view: function() {
    return m('', [
      m('h1.page-title', 'Filterable tables demo'),
      m.component(table, {key: 'name'}),
      m.component(table, {key: 'location'}),
      m('a[href=/data-entry]', {
        config: m.route // to maintain an spa
      }, 'Enter custom data')
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
  ctrl.group = ctrl.dimension.group().reduce(
    function(p,v){
      return p + v.count;
    },
    function(p,v){
      return p - v.count;
    },
    function(){return 0;}
  );

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
  // use top to get naturally ordered values
  var all = ctrl.group.top(Infinity);
  return m('table', [
    m('thead', m('tr', [
      m('th', ctrl.dimension_name),
      m('th', 'count')
    ])),
    m('tbody',
      all
      // sort by descending value order
      .map(function(d){
        var tdClick = function() {
          ctrl.onClick(d);
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
        return m('tr' + trClass, {
          key: d.key
        }, [
          m('td', {
            onclick: tdClick,
            key: d.key + '_key'
          }, '' + d.key),
          m('td', {
            onclick: tdClick,
            key: d.key + '_value'
          }, '' + d.value)
        ]);
      })
    )
  ]);
};

var component404 = {
  view: function() {
    return m('h1.page-title', 'Couldn\'t find this route');
  }
};

var dataEntry = {
  controller: function(){
    var ctrl = {
      row: {
        name: m.prop(''),
        location: m.prop('')
      },
      addData: function(){
        cf.add([{
          name: ctrl.row.name(),
          location: ctrl.row.location()
        }]);
      }
    };
    return ctrl;
  },
  view: function(ctrl) {
    return m('', [
      m('.input', [
        m('.title', 'Name'),
        m('input[type=text]', {
          value: ctrl.row.name(),
          oninput: m.withAttr('value', ctrl.row.name)
        })
      ]),
      m('.input', [
        m('.title', 'Location'),
        m('input[type=text]', {
          value: ctrl.row.location(),
          oninput: m.withAttr('value', ctrl.row.location)
        })
      ]),
      m('button[type=button]', {onclick: ctrl.addData}, 'Save'),
      m('br'),
      m('a[href=/]', {config: m.route}, 'Go back')
    ]);
  }
};

// the script is in the head tag so we need to wait for the browser
// to create the body element before continuing
window.onload = function() {
  m.route(document.body, '/', {
    '/': topComponent,
    '/data-entry': dataEntry,
    '/:a...': component404
  });
};
