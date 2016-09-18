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
    style2: [ ccm.load, 'overlay.css' ],
    js : [ccm.load, 'spreadsheet.js'],
    store: [ccm.store , { url: 'ws://ccm2.inf.h-brs.de/index.js', store: 'hbrs-spreadsheet' }],
    key :  []
  },



  Instance: function () {

    var self = this;
    this.mSpreadsheet = null;
    this.mSpKey = "SharedTest";
    this.mOverlayActive = true;
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


      //we need to find out how many cells we have




      //Remove current content and replace with new inner content
      var element = ccm.helper.element(this); // We get back an javascript element which we can use

     // element.html("<div id='toolBox'> <input type='button' value='Summe' onclick='function(){self.mSpreadsheet.selectArea(\"Summe\");}'/> <input type='button' value='Min' onclick='function(){self.mSpreadsheet.selectArea(\"Min\");}'/> <input type='button' value='Max' onclick='function(){self.mSpreadsheet.selectArea(\"Max\");}'/> <input type='button' value='Avg' onclick='function(){self.mSpreadsheet.selectArea(\"Avg\");}'/> To use an equation add = in front.</div> <div id='sheet'></div>" + self.mSpreadsheet.generateHTML());


      if(window.location.href.indexOf("page") != -1) {
        self.mOverlayActive = false;
      }

      var htmlcode ="";
      if(self.mOverlayActive == true )
      {

        htmlcode = self.genOverlay();
        element.html( htmlcode );
        document.getElementById("switchSpreadSheetButton").addEventListener("click",function(){self.switchSpreadSheet();}, false);
        document.body.style.margin =0;
      }
      else
      {
        self.mOverlayActive = false;



        self.mSpreadsheet = new Spreadsheet(24, 48);

        //register onchange function to storage
        self.store.onChange = function (_dataset)
        {
          self.mSpreadsheet.updateCellWithValue(_dataset.key[1], _dataset.value);
        };

        self.mSpreadsheet.onCellChangeCallback = function (_Cell)
        {
          self.store.set({key: self.getKey(_Cell), value: _Cell.getEquation()}, null);
        };

        var sp = self.mSpreadsheet;

        var toolbox = "  <div id='toolBox' style='position:fixed; top:0; width: 100%; padding:10px; margin:0px;'><table><tr><td> <div class='toolbarButton' id='new_change_button'>New/Change</div></td>" +
                "<td><div id='toolbarButton' class='toolbarButton'>fx &#x2193;</div></td>" +
            "</tr></table> </div> <div id='eqBox' class='eqBox'><input type='button' id='summe_button' value='Summe' /><br /><input type='button' id='min_button' value='Min' /><br /><input type='button' id='max_button' value='Max' /><br /><input type='button' id='avg_button' value='Avg' /></div>";



        htmlcode = '<div class="backgroundelement" style="background: hsla(0,0%,0%,0.9);">' + toolbox + "<div id='sheet' style='margin-top:50px; width:100%; height:100%; overflow: scroll'>" + self.mSpreadsheet.generateHTML() + "</div></div>";



        element.html( htmlcode );


        document.getElementById("toolbarButton").addEventListener("click",function(event)
        {
          self.switchEqToolbar();
          event.preventDefault();
        }, false);


        document.getElementById("new_change_button").addEventListener("click",function(){self.mOverlayActive =true; history.replaceState({page:0}, "Spreadsheet", "?front"); self.render();}, false);
        document.getElementById("avg_button").addEventListener("click",function(){sp.selectArea("Avg"); self.switchEqToolbar();}, false);
        document.getElementById("summe_button").addEventListener("click",function(){sp.selectArea("Summe"); self.switchEqToolbar();}, false);
        document.getElementById("min_button").addEventListener("click",function(){sp.selectArea("Min"); self.switchEqToolbar();}, false);
        document.getElementById("max_button").addEventListener("click",function(){sp.selectArea("Max"); self.switchEqToolbar();}, false);
        document.body.style.margin =0;

        self.initSpreadsheet(self.mSpreadsheet)

      }
      //generateSheet();
      if (callback) callback();
    };

    self.switchSpreadSheet = function( )
    {


      self.mSpKey = document.getElementById("switchSpreadSheetInput").value;
      self.mOverlayActive = false;

      history.replaceState({page: self.mSpKey}, "Spreadsheet", "?page=" + self.mSpKey);

      self.render();
    };


    self.switchEqToolbar = function ()
    {

      if(document.getElementById('eqBox').style.display == 'inline')
      {
        document.getElementById('eqBox').style.display =  'none';
      }
      else
      {
        document.getElementById('eqBox').style.display =  'inline';

      }

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

    self.genOverlay = function()
    {
      var overlayHTML = '<div>' +
          '<div class="backgroundelement" style="background: hsla(0,0%,0%,0.9);"></div><div style="display:block; width:100%; position:fixed; text-align:center; top:35%;"><div style="display: block; padding:15px;"> <input type="text" id="switchSpreadSheetInput" value="'+self.mSpKey+'"></div><br/><div id="switchSpreadSheetButton" class="btn" >Create/Join</div><div style="display:block; padding-top:50px; color:white;">Please use the chrome browser!</div>></div>';

      return overlayHTML;
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
