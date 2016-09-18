/**
 * Created by Florian Wurth on 28.05.16.
 */


//////////////Cell class ///////////////

var SS_Cell = function( _column, _row, _sheet )
{
    this.mColumn = _column;
    this.mRow = _row;
    this.mId = this.generateId(_column, _row);
    this.mObjRef = null;
    this.onCellChangeCallback = null;
    this.mSpreadSheet = _sheet;
    this.mValue ="";
    this.mEquationValue = "";
    this.mMyLastCaretPosition = 0;
    this.mActiveClass = "input--textfield-off td";
    this.Editable = false;
    this.mFocus = false;
    this.mObserverCells = [];
};



SS_Cell.prototype.addObserver = function( _cell )
{
    if(!_cell)
    {

        return;
    }
    for(var i = 0; i < this.mObserverCells.length;i++)
    {
        if(_cell == this.mObserverCells[i])
        {
            return;
        }

    }
    this.mObserverCells.push(_cell);
};

SS_Cell.prototype.getColumn = function()
{
    return this.mColumn;
};

SS_Cell.prototype.getRow = function()
{
    return this.mRow;
};


SS_Cell.prototype.generateId = function(_column, _row)
{
    var id = "c"+ _column + "r" +  _row;
    return id;
};

SS_Cell.prototype.getId = function()
{
    return this.mId;
};

SS_Cell.prototype.getValue = function()
{
    return this.mValue;
};

SS_Cell.prototype.getEquation = function()
{
    return this.mEquationValue;
};



SS_Cell.prototype.getObjRef = function ()
{
    if(this.mObjRef == null)
    {
        this.mObjRef = document.getElementById(this.mId);
        if(this.mObjRef == null)
        {
            Console.log("error");

        }
        this.SetInActive();
        this.registerEvents();
    }
    return this.mObjRef;
};




SS_Cell.prototype.onCellChange = function (  )
{
    this.mMyLastCaretPosition=doGetCaretPosition(this.getObjRef());

    this.setEquation(this.getObjRef().innerHTML);
    this.SetInActive();







    if(this.onCellChangeCallback != null)
    {
        this.onCellChangeCallback(this);
    }
};


//Evaluates equation and sets new mValue
SS_Cell.prototype.evaluateEquation = function()
{
    var statmentResult = this.mSpreadSheet.evaluateStatment(this.mEquationValue, this);
    this.mValue = statmentResult;
    this.setValue(this.mValue);

       for(var i = 0; i < this.mObserverCells.length;i++)
       {
           this.mObserverCells[i].evaluateEquation();
     }


    };

SS_Cell.prototype.updateGUI = function()
{
    if(this.getObjRef() == null)
    {
        return;
    }
    //this.getObjRef().value = this.mValue;
    this.getObjRef().innerHTML = this.mValue;
    return this.mId;
};

SS_Cell.prototype.setValue = function( _value )
{
    this.mValue = _value;
    this.updateGUI();
};

SS_Cell.prototype.setEquation = function( _value )
{
    this.mEquationValue = _value;
    this.evaluateEquation();
};


SS_Cell.prototype.gainFocus = function()
{
    if(this.mFocus)
    {
        return;
    }
    this.mFocus = true;



    this.getObjRef().focus();
    this.setValue(this.mEquationValue);
    this.SetSelectedPre();

};

SS_Cell.prototype.loseFocus  = function()
{
    if(!this.mFocus)
    {
        return;
    }
    this.mFocus = false;
    this.onCellChange();

};

SS_Cell.prototype.SetSelected  = function()
{
    this.SetActiveClass("input--textfield-selected td");
};

SS_Cell.prototype.SetSelectedPre  = function()
{
    this.SetActiveClass("input--textfield-selected-pre td");
};

SS_Cell.prototype.SetInActive  = function()
{
    this.SetActiveClass("input--textfield-off td");
    this.Editable = false;
    this.setValue(this.mValue);
};

SS_Cell.prototype.SetActive  = function()
{
    this.SetActiveClass("input--textfield-on td");
    //this.getObjRef().focus();
    this.Editable = true;

};


SS_Cell.prototype.SetActiveClass  = function( _class )
{

    this.mActiveClass = _class;
    this.getObjRef().className = _class;

};

SS_Cell.prototype.readOnlyKeypressHandler = function (event)
{
    if(this.Editable ) {return;}
    event.preventDefault();
};

SS_Cell.prototype.registerEvents = function ( _cell )
{
    var that = this;
    this.getObjRef().addEventListener("keypress",function(event){that.readOnlyKeypressHandler(event);}, false);
};


SS_Cell.prototype.insertFunctionCall = function ( _functionName ) {
    this.gainFocus();
    var inputValue = this.mValue;
    var output = [inputValue.slice(0, this.mMyLastCaretPosition), _functionName + "()", inputValue.slice(this.mMyLastCaretPosition)].join('');
    this.setValue(output);
    this.mMyLastCaretPosition = this.mMyLastCaretPosition + _functionName.length + 1;
    //this.getObjRef().setSelectionRange( this.mMyLastCaretPosition,  this.mMyLastCaretPosition);

    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(this.getObjRef().childNodes[0], this.mMyLastCaretPosition);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    this.SetActive();
};

SS_Cell.prototype.insertSelectionRange = function ( _selectionrange )
{
    var inputValue = this.getObjRef().innerHTML;

    var output = [inputValue.slice(0, this.mMyLastCaretPosition), _selectionrange, inputValue.slice(this.mMyLastCaretPosition)].join('');

    this.getObjRef().innerHTML = output;
   // this.SetActive();
   // this.getObjRef().setSelectionRange(this.mMyLastCaretPosition,this.mMyLastCaretPosition);


    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(this.getObjRef().childNodes[0], this.mMyLastCaretPosition);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

};

//////////////Spreadsheet class ///////////////


var Spreadsheet = function( _numberOfColumns, _numberOfRows )
{
    this.mNumberOfColumns = _numberOfColumns;
    this.mNumberOfRows = _numberOfRows;
    this.mCells = null;
    this.generateCells();
    this.onCellChangeCallback = null;
    this.mCellWithFocus = null;
    this.mSelectionActive = false;
    this.mEditing = false;
    this.mClickCounter = 0;
    this.mTimeSinceLastClick = 0;
    this.mLastClickedCell = null;
    this.mLastSelectedCell = null;
    this.mSelectionCell = null;
};


Spreadsheet.prototype.clickedOnCell = function(_cell,e)
{

    if(this.mEditing == true && this.mLastSelectedCell == _cell)
    {
        _cell.SetSelected();
        return;
    }

    this.mLastSelectedCell = _cell;

    if(this.mLastClickedCell != _cell)
    {
        this.mClickCounter = 0;
        this.mTimeSinceLastClick = 0;
    }



    if(this.mClickCounter == 1)
    {
        var d = new Date();
        if(this.mLastClickedCell == _cell && d.getTime() - this.mTimeSinceLastClick < 1000)
        {
            this.doubleClickOnCell(_cell);
        }
        this.mLastClickedCell =  null;

        this.mTimeSinceLastClick = 0;
        this.mClickCounter = 0;

    }else  if(this.mClickCounter == 0)
    {
        this.mClickCounter++;
        this.mLastClickedCell = _cell;

        var d = new Date();
        this.mTimeSinceLastClick = d.getTime();
    }



};

Spreadsheet.prototype.init = function( _column, _row )
{
    for(var c = 0; c < this.mCells.length; c++)
    {
        for(var r = 0; r < this.mCells[c].length; r++)
        {
            this.mCells[c][r].getObjRef();
            this.registerEvents(this.mCells[c][r]);
        }
    }

};


Spreadsheet.prototype.cellGainedFocus = function ( _cell ,e)
{
    if(this.mSelectionActive)
    {
        event.preventDefault();
        return;
    }
    _cell.gainFocus();
};

Spreadsheet.prototype.cellLostFocus = function ( _cell ,e)
{
    if(this.mSelectionActive)
    {
        event.preventDefault();
        return;
    }
    _cell.loseFocus();
    this.mEditing = false;
    if(this.onCellChangeCallback != null)
    {
        this.onCellChangeCallback(_cell);
    }
};

Spreadsheet.prototype.keyPressedOnCell = function(e,_cell )
{
    var keynum;

    if(window.event) { // IE
        keynum = e.keyCode;
    } else if(e.which){ // Netscape/Firefox/Opera
        keynum = e.which;
    }

    if(keynum == 37)
    {
        if(this.mEditing){return;}
        var newCell = this.getCell(_cell.getColumn()-1,_cell.getRow());
        if(newCell != null)
        {
            this.cellLostFocus(_cell);
            this.cellGainedFocus(newCell);
        }
    }
    else if(keynum == 38)
    {
        if(this.mEditing){return;}
        var newCell = this.getCell(_cell.getColumn(),_cell.getRow()-1);
        if(newCell != null) {
            this.cellLostFocus(_cell);
            this.cellGainedFocus(newCell);
        }
    }
    else if(keynum == 39)
    {
        if(this.mEditing){return;}
        var newCell = this.getCell(_cell.getColumn() +1,_cell.getRow());
        if(newCell != null)
        {
            this.cellLostFocus(_cell);
            this.cellGainedFocus(newCell);
        }
    }
    else if(keynum == 40)
    {
        if(this.mEditing){return;}
        var newCell = this.getCell(_cell.getColumn(),_cell.getRow()+1);
        if(newCell != null)
        {
            this.cellLostFocus(_cell);
            this.cellGainedFocus(newCell);
        }
    }
    else if(keynum == 13)
    {
        if(!this.mEditing)
        {
            this.mEditing = true;
            _cell.SetActive();
        }
        else
        {
            this.cellLostFocus(_cell);
            var newCell = this.getCell(_cell.getColumn(),_cell.getRow()+1);
            if(newCell != null)
            {
                this.cellGainedFocus(newCell);
            }
            else
            {
                this.cellGainedFocus(_cell);
            }
        }
    }
    else
    {
        if(this.mEditing){return;}
        this.mEditing = true;
        //_cell.setValue(String.fromCharCode(keynum));
        _cell.SetActive();
    }

};


Spreadsheet.prototype.getCell = function( _column, _row )
{
    if(this.mCells.length > _column && this.mCells[_column] != null)
    {
        if(this.mCells[_column].length > _row)
        {
            return this.mCells[_column][_row];
        }
    }

    return null;
};

Spreadsheet.prototype.getCellWithId = function( _cellid )
{
    for(var c = 0; c < this.mCells.length; c++)
    {
        for(var r = 0; r < this.mCells[c].length; r++)
        {
            if( _cellid == this.mCells[c][r].getId())
            {
                return this.mCells[c][r];
            }
        }
    }
    return null;
};

Spreadsheet.prototype.updateCellWithValue = function (_cellid, _value)
{
    var cell = this.getCellWithId(_cellid);
    if(cell != null)
    {
        cell.setEquation(_value);
    }
};

Spreadsheet.prototype.addRow = function()
{

};

Spreadsheet.prototype.addColumn = function()
{

};

Spreadsheet.prototype.getNumberOfRows = function()
{
    return this.mNumberOfRows;
};

Spreadsheet.prototype.getNumberOfColumns = function()
{
    return this.mNumberOfColumns;
};

Spreadsheet.prototype.generateHTML = function()
{

    if(this.mCells == null)
    {
        this.generateCells();
    }
    var htmlTable = "";
    htmlTable ="";
    htmlTable += "<div class='table'>";

    for(var rows = -1; rows < this.getNumberOfRows(); rows++)
    {
        htmlTable += "<div class='tr'>";
        for (var columns = -1; columns < this.getNumberOfColumns(); columns++)
        {


            //htmlTable += "<div class='td'>";
            if(rows == -1 && columns == -1)
            {}
            else if(rows == -1 && columns != -1)
            {
                //htmlTable += "c" + columns;
            }
            else if(columns == -1 && rows != -1)
            {
                //htmlTable += "r" + rows;
            }
            else
            {
                //htmlTable += "<input type='text' id='" + this.mCells[columns][rows].getId() + "' value='"+this.mCells[columns][rows].getValue()+"'/>";

                htmlTable += "<div class='td' contentEditable='true' id='" + this.mCells[columns][rows].getId() + "'>" + this.mCells[columns][rows].getValue()+"</div>";
            }

            //htmlTable += "</div>";

        }
        htmlTable += "</div>";
    }

    htmlTable += "</div>";
    return htmlTable;
};

Spreadsheet.prototype.doubleClickOnCell = function ( _cell )
{
    _cell.SetActive();
    this.mEditing = true;
};



Spreadsheet.prototype.registerEvents = function ( _cell )
{
    var that = this;
    var cell = _cell;
    cell.getObjRef().addEventListener("focus",function(e){that.cellGainedFocus(cell,e);}, false);
    //cell.getObjRef().addEventListener("focusout",function(){that.cellLostFocus(cell);}, false);
    cell.getObjRef().addEventListener("blur",function(e){that.cellLostFocus(cell,e);}, false);


    cell.getObjRef().addEventListener("click",function(e){that.clickedOnCell (cell,e);}, false);
    cell.getObjRef().addEventListener("keydown",function(e){that.keyPressedOnCell(e,cell);}, false);


    cell.getObjRef().addEventListener("mouseup",function(e){that.mouseUpOnCell(cell,e);}, false);
    cell.getObjRef().addEventListener("mousedown",function(e){that.mouseDownOnCell(cell,e);}, false);

    cell.getObjRef().addEventListener("mouseleave",function(e){that.mouseLeaveCell(cell,e);}, false);
    cell.getObjRef().addEventListener("mouseover",function(e){that.mouseOverCell(cell,e);}, false);

};


Spreadsheet.prototype.mouseUpOnCell = function(_cell,e)
{
    if(!this.mSelectionActive){return;}
    event.preventDefault();
    this.mSelectionClickActive = false;
    this.mSelectionActive = false;

    for(var rows = 0; rows < 24; rows++)
    {
        for (var columns = 0; columns < 24; columns++)
        {
            this.getCell(rows,columns).SetActiveClass("input--textfield-off td");
        }
    }

    this.mEditing = true;
    this.mLastSelectedCell.SetActiveClass("input--textfield-on td");


    //Select everything
    var startCell = this.mSelectionCell;
    var currentCell = _cell;

    var columnStartCell = startCell.getColumn();
    var rowStartCell = startCell.getRow();

    var columnCurrentCell = currentCell.getColumn();
    var rowCurrentCell = currentCell.getRow();


    if(columnStartCell > columnCurrentCell)
    {
        var tmp = columnCurrentCell;
        columnCurrentCell = columnStartCell;
        columnStartCell = tmp;
    }

    if(rowStartCell > rowCurrentCell)
    {
        var tmp = rowCurrentCell;
        rowCurrentCell = rowStartCell;
        rowStartCell = tmp;
    }

    var selected = "c" + columnStartCell +"r" + rowStartCell + ":" + "c" + columnCurrentCell + "r" + rowCurrentCell;

    this.mLastSelectedCell.insertSelectionRange(selected);


    this.mSelectionCell = null;

};

Spreadsheet.prototype.mouseDownOnCell = function(_cell,e)
{
    if(!this.mSelectionActive){return;}
    event.preventDefault();
    this.mSelectionCell =_cell;
    this.mSelectionClickActive = true;

};

Spreadsheet.prototype.mouseLeaveCell = function(_cell,e)
{
    if(!this.mSelectionActive)
    { return;}

    if (!this.mSelectionClickActive) {

        if(_cell == this.mLastSelectedCell)
        {
            _cell.SetActiveClass("input--textfield-on td");
        }
        else
        {
            _cell.SetActiveClass("input--textfield-off td");
        }


        return;
    }

};

Spreadsheet.prototype.mouseOverCell = function(_cell,e)
{
    if(!this.mSelectionActive)
    { return;}

    if(!this.mSelectionClickActive)
    {

        _cell.SetActiveClass("input--textfield-selection td");
        return;
    }


    //Select everything
    var startCell = this.mSelectionCell;
    var currentCell = _cell;

    var columnStartCell = startCell.getColumn();
    var rowStartCell = startCell.getRow();

    var columnCurrentCell = currentCell.getColumn();
    var rowCurrentCell = currentCell.getRow();


    if(columnStartCell > columnCurrentCell)
    {
        var tmp = columnCurrentCell;
        columnCurrentCell = columnStartCell;
        columnStartCell = tmp;
    }

    if(rowStartCell > rowCurrentCell)
    {
        var tmp = rowCurrentCell;
        rowCurrentCell = rowStartCell;
        rowStartCell = tmp;
    }

    for(var rows = 0; rows < 24; rows++)
    {
        for (var columns = 0; columns < 24; columns++)
        {

            if(rows >= rowStartCell && rows <= rowCurrentCell && columns >= columnStartCell && columns <= columnCurrentCell)
            {
                this.getCell(columns,rows).SetActiveClass("input--textfield-selection td");
            }
            else
            {
                this.getCell(columns,rows).SetActiveClass("input--textfield-off td");
            }

        }
    }

};

Spreadsheet.prototype.generateCells = function()
{
    //If cells have been created, dont create them again
    if(this.mCells != null)
    {
        return;
    }

    //create array of cells
    this.mCells = [this.mNumberOfColumns];
    var that = this;
    //Create cellsSpreadsheet
    for(var c = 0; c <  this.mNumberOfColumns;c++)
    {
        this.mCells[c] = [this.mNumberOfRows];

        for(var r = 0; r <  this.mNumberOfRows;r++)
        {
            this.mCells[c][r] = new SS_Cell(c,r, this);
            //this.mCells[c][r].onCellChangeCallback = function(_cell){that.onCellChange(_cell);};
        }
    }
};

Spreadsheet.prototype.getValues = function(_argument, _cell) {

    var values = new Array();

    var splitIndex = _argument.indexOf(":");
    var front = _argument.substring(0, splitIndex);
    var back = _argument.substring(splitIndex, _argument.length);


    var column1 = Number(front.substring(front.indexOf("c")+1, front.indexOf("r")));
    var row1 = Number(front.substring(front.indexOf("r")+1, front.length));
    var column2 = Number(back.substring(back.indexOf("c")+1, back.indexOf("r")));
    var row2 = Number(back.substring(back.indexOf("r")+1, back.length));


    if (column1 > column2 || row1 > row2) {
        return -1;
    }
    for (var c = column1; c <= column2; c++)
    {
        for (var r = row1; r <= row2; r++)
        {


            values.push( Number(this.getCell(c,r).getValue()));
            this.getCell(c,r).addObserver(_cell);
        }
    }



    return values;
};

Spreadsheet.prototype.resolveFunctions = function( _statment , _cell)
{
    _statment = _statment.substring(1,_statment.length);


    var functionNames = ["Summe", "Min", "Max", "Avg"];
    var functionCalls = [sum, min, max, avg];

    for(var i = 0; i < functionNames.length; i++)
    {
        var index = _statment.search(functionNames[i]);

        while(index != -1)
        {
            var start = _statment.indexOf('(',index);
            var stop = _statment.indexOf(')',index);
            var argument = _statment.substring(start+1,stop);

            var numbers = this.getValues(argument,_cell);
            var result = functionCalls[i](numbers);
            _statment = _statment.substring(0,index) + result + _statment.substring(stop+1,_statment.length);

            index = _statment.search(functionNames[i]);
        }
    }

    return _statment;
};

Spreadsheet.prototype.evaluateStatment = function( _statment, _cell)
{

    _statment.trim();
    var result = _statment;


    if(_statment[0] == '=' )
    {


        var toEvaluate =  this.resolveFunctions(_statment, _cell);
        //We have an equation

        try {

            result = eval(toEvaluate);
        }
        catch(e)
        {
            //return toEvaluate;
            //alert("Error")
        }



    }
    return result;
};

Spreadsheet.prototype.selectArea  = function( _functionName )
{

    if(this.mLastSelectedCell == null)
    {
        return;
    }

    this.mLastSelectedCell.insertFunctionCall(_functionName);

    this.mSelectionActive = true;
    this.mSelectionClickActive = false;
    this.mEditing = true;


};













EDITABLE = false;
SELECTION_ACTIVE=false;
SELECTION_CLICK_ACTIVE=false;
CELL_SELECTED="";
LAST_CELL="";
LAST_CELL_POS=0;
CELL_SELECTED="";

function sum ( _numbers )
{
    var result = 0;
    for(var i = 0; i< _numbers.length;i++)
    {
        result += _numbers[i];
    }
    return result;
}

function min ( _numbers )
{
    var result = 100000000000000000;
    for(var i = 0; i< _numbers.length;i++)
    {
        if(_numbers[i] < result)
        {
            result = _numbers[i];
        }
    }
    return result;
}

function max ( _numbers )
{
    var result = -100000000000000000;
    for(var i = 0; i< _numbers.length;i++)
    {
        if(_numbers[i] > result)
        {
            result = _numbers[i];
        }
    }
    return result;
}

function avg ( _numbers )
{
    var result = 0;
    for(var i = 0; i< _numbers.length;i++)
    {
        result+= _numbers[i];
    }
    result /= _numbers.length;

    return result;
}






//SRC: http://stackoverflow.com/questions/2897155/get-cursor-position-in-characters-within-a-text-input-field
function doGetCaretPosition (editableDiv) {

    var caretPos = 0,
        sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            if (range.commonAncestorContainer.parentNode == editableDiv) {
                caretPos = range.endOffset;
            }
        }
    } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        if (range.parentElement() == editableDiv) {
            var tempEl = document.createElement("span");
            editableDiv.insertBefore(tempEl, editableDiv.firstChild);
            var tempRange = range.duplicate();
            tempRange.moveToElementText(tempEl);
            tempRange.setEndPoint("EndToEnd", range);
            caretPos = tempRange.text.length;
        }
    }
    return caretPos;
}
