/*--------------------------------------------------------------------------------
再移動後に待機コマンドを表示する ver 1.1

■作成者
キュウブ

■概要
このスクリプトを導入すると
再移動後や全く移動していない状態でキャンセルボタンを押した時に待機コマンドが表示され、
待機コマンドを押さずにキャンセルするとまた再移動をやり直せます

つまり、プレイヤーのうっかりミスが起きにくくなります

■更新履歴
ver 1.1 (2019/9/21)
マーキング範囲更新スクリプトに対応
再移動時にマーキング範囲が更新されるようになります

ver 1.0 (2017/8/27)

■対応バージョン
SRPG Studio Version:1.161

■規約
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・加工等、問題ありません。
・クレジット明記無し　OK (明記する場合は"キュウブ"でお願いします)
・再配布、転載　OK (バグなどがあったら修正できる方はご自身で修正版を配布してもらっても構いません)
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。

--------------------------------------------------------------------------*/

(function(){
	var tempFunctions = {
		RepeatMoveFlowEntry: {
			_prepareMemberData: RepeatMoveFlowEntry._prepareMemberData,
			_completeMemberData: RepeatMoveFlowEntry._completeMemberData
		}
	};

	var RepeatMoveFlowMode = {
		MAPSEQUENCE	: 0,
		UNITCOMMAND	: 1
	};

	RepeatMoveFlowEntry._unitCommandManager = null;
	RepeatMoveFlowEntry._unit = null;
	RepeatMoveFlowEntry._saveMostResentMov = 0;
	RepeatMoveFlowEntry._xCursorSave = 0;
	RepeatMoveFlowEntry._yCursorSave = 0;
	RepeatMoveFlowEntry.moveFlowEntry = function() {

		var mode = this.getCycleMode();
		var result = MoveResult.END;

		if (mode === RepeatMoveFlowMode.MAPSEQUENCE) {
			result = this._moveMapSequence();
		}
		else if (mode === RepeatMoveFlowMode.UNITCOMMAND) {
			result = this._moveUnitCommand();
		}

		return result;
	};

	RepeatMoveFlowEntry._moveMapSequence = function() {
		var result = this._mapSequenceArea.moveSequence();

		if (result === MapSequenceAreaResult.COMPLETE) {
			MapLayer.getMarkingPanel().updateMarkingPanelFromUnit(this._unit);
			this.changeCycleMode(RepeatMoveFlowMode.UNITCOMMAND);
		}
		else if (result === MapSequenceAreaResult.CANCEL) {
			this.changeCycleMode(RepeatMoveFlowMode.UNITCOMMAND);
		}

		return MoveResult.CONTINUE;
	};

	RepeatMoveFlowEntry._moveUnitCommand = function() {
		var result;

		if (this._unitCommandManager.moveListCommandManager() !== MoveResult.CONTINUE) {
			result = this._doLastAction();
			if (result === 0) {
				return MoveResult.END;
			}
			else {
				this._unit.setMostResentMov(this._saveMostResentMov);
				this._mapSequenceArea.openSequence(this);
				this.changeCycleMode(RepeatMoveFlowMode.MAPSEQUENCE);
				return MoveResult.CONTINUE;
			}
		}

		return MoveResult.CONTINUE;
	};

	RepeatMoveFlowEntry.drawFlowEntry = function() {
		var mode = this.getCycleMode();

		if (mode === RepeatMoveFlowMode.MAPSEQUENCE) {
			this._mapSequenceArea.drawSequence();
		} 
		else if (mode === RepeatMoveFlowMode.UNITCOMMAND) {
			this._unitCommandManager.drawListCommandManager();
		}
	};

	RepeatMoveFlowEntry._prepareMemberData = function(playerTurn) {
		tempFunctions.RepeatMoveFlowEntry._prepareMemberData.call(this, playerTurn);
		this._unitCommandManager = createObject(RepeatMoveUnitCommand);
	};

	
	RepeatMoveFlowEntry._completeMemberData = function(playerTurn) {
		var result = tempFunctions.RepeatMoveFlowEntry._completeMemberData.call(this, playerTurn);
		
		if (result !== EnterResult.NOTENTER) {
			this._unit = playerTurn.getTurnTargetUnit();
			this._unitCommandManager.setListCommandUnit(this._unit);
			this._unitCommandManager.openListCommandManager();
			this._saveMostResentMov = this._unit.getMostResentMov();
			this._xCursorSave = this._unit.getMapX();
			this._yCursorSave = this._unit.getMapY();
			this.changeCycleMode(RepeatMoveFlowMode.MAPSEQUENCE);
			MapLayer.getMarkingPanel().updateMarkingPanelFromUnit(this._unit);
		}

		return result;
	};

	RepeatMoveFlowEntry._doLastAction = function() {

		if (this._unitCommandManager.getExitCommand() !== null) {
			return 0;
		} 
		else {
			this._unit.setMapX(this._xCursorSave);
			this._unit.setMapY(this._yCursorSave);
			MapLayer.getMarkingPanel().updateMarkingPanelFromUnit(this._unit);
		}

		this._unit.setDirection(DirectionType.NULL);
		return 1;
	};

})();

var RepeatMoveUnitCommand = defineObject(UnitCommand,
{
	// 再移動状態なのでもう一度再移動はさせない
	isRepeatMovable: function() {
		return false;
	},

	// 再移動状態で表示されるのは待機コマンドのみ
	configureCommands: function(groupArray) {
		groupArray.appendObject(UnitCommand.Wait);
	}
}
);