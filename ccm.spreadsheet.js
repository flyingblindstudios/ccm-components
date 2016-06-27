/**
 * @overview ccm component for simple chats
 * @author André Kless <andre.kless@web.de> 2016
 */




ccm.component( {

  name: 'spreadsheet',

  config: {

    //html:  [ ccm.store, { local: 'templates.json' } ],
    //key:   'test',
    //store: [ ccm.store, { url: 'ws://ccm2.inf.h-brs.de/index.js', store: 'spreadsheet' } ],
    style: [ ccm.load, 'sp1style.css' ],
    js : [ccm.load, 'spreadsheet.js'],
    store: [ccm.store , { url: 'ws://ccm2.inf.h-brs.de/index.js', store: 'hbrs-spreadsheet' }],
    key :  []
  },



  Instance: function () {

    var self = this;
    this.mSpreadsheet = null;
    this.mSpKey = "Shared";
    self.init = function (callback) {





      if (callback) callback();

    };


    //Rendering is not really "rendering" -> justs fills the page with html
    self.render = function (callback) {

      if(self.mSpreadsheet != null)
      {
        delete self.mSpreadsheet;
        self.mSpreadsheet = null;
      }
      self.mSpreadsheet = new Spreadsheet(24, 24);

      //register onchange function to storage
      self.store.onChange = function (_dataset)
      {
        self.mSpreadsheet.updateCellWithValue(_dataset.key[1], _dataset.value);
      };

      self.mSpreadsheet.onCellChangeCallback = function (_Cell)
      {
        self.store.set({key: self.getKey(_Cell), value: _Cell.getEquation()}, null);
      };

      //Remove current content and replace with new inner content
      var element = ccm.helper.element(this); // We get back an javascript element which we can use

     // element.html("<div id='toolBox'> <input type='button' value='Summe' onclick='function(){self.mSpreadsheet.selectArea(\"Summe\");}'/> <input type='button' value='Min' onclick='function(){self.mSpreadsheet.selectArea(\"Min\");}'/> <input type='button' value='Max' onclick='function(){self.mSpreadsheet.selectArea(\"Max\");}'/> <input type='button' value='Avg' onclick='function(){self.mSpreadsheet.selectArea(\"Avg\");}'/> To use an equation add = in front.</div> <div id='sheet'></div>" + self.mSpreadsheet.generateHTML());
      var sp = self.mSpreadsheet;


      var toolbox = "  <div id='toolBox'><input type='input' id='switchSpreadSheetInput' value='"+self.mSpKey+"' /><input type='button' id='switchSpreadSheetButton' value='SET' />  <br /> <input type='button' id='summe_button' value='Summe' /> <input type='button' id='min_button' value='Min' /> <input type='button' id='max_button' value='Max' />  <input type='button' id='avg_button' value='Avg' /> To use an equation add = in front.</div> <div id='sheet'></div>";



      element.html(toolbox + self.mSpreadsheet.generateHTML());

      document.getElementById("switchSpreadSheetButton").addEventListener("click",function(){self.switchSpreadSheet();}, false);


      document.getElementById("avg_button").addEventListener("click",function(){sp.selectArea("Avg");}, false);
      document.getElementById("summe_button").addEventListener("click",function(){sp.selectArea("Summe");}, false);
      document.getElementById("min_button").addEventListener("click",function(){sp.selectArea("Min");}, false);
      document.getElementById("max_button").addEventListener("click",function(){sp.selectArea("Max");}, false);




      self.initSpreadsheet(self.mSpreadsheet);
      //generateSheet();
      if (callback) callback();
    };

    self.switchSpreadSheet = function( )
    {


      self.mSpKey = document.getElementById("switchSpreadSheetInput").value;
      self.render();
    };

    self.initSpreadsheet = function ( _spreadsheet )
    {


      var columns = _spreadsheet.getNumberOfColumns();
      var rows = _spreadsheet.getNumberOfRows();

      for(var c = 0; c < columns; c++)
      {
        for(var r = 0; r < rows; r++)
        {
          self.setValueForCell(_spreadsheet.getCell(c,r));
        }
      }
      _spreadsheet.init();

    };

    self.getKey = function ( _cell )
    {
      self.key[1] = _cell.getId();
      self.key[0] = self.mSpKey;
      return self.key;
    };


    self.setValueForCell = function ( _cell )
    {
      var localCell = _cell;

      self.store.get(self.getKey(localCell), function(_dataset)
      {
        if(_dataset != null && _dataset.value != undefined)
        {
          localCell.setEquation(_dataset.value);
        }
        else
        {
          localCell.setEquation("");
        }

      });
    };


  }

} );