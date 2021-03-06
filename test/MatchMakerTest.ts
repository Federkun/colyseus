import * as assert from 'assert';
import * as sinon from 'sinon';
import { MatchMaker } from "../src/MatchMaker";
import { Room } from "../src/Room";
import { createDummyClient, DummyRoom } from "./utils/mock";

describe('MatchMaker', function() {
  let matchMaker;

  beforeEach(function() {
    matchMaker = new MatchMaker()
    matchMaker.addHandler('room', DummyRoom);
    matchMaker.addHandler('dummy_room', DummyRoom);
  });

  describe('room handlers', function() {

    it('should add handler with name', function() {
      assert.equal(DummyRoom, matchMaker.handlers.room[0]);
      assert.equal(0, Object.keys(matchMaker.handlers.room[1]).length);
      assert.equal(false, matchMaker.hasAvailableRoom('room'));
    });

    it('should create a new room on joinOrCreateByName', function(done) {
      matchMaker.onJoinRoomRequest('room', {}, true, (err, room) => {
        assert.ok(typeof(room.roomId) === "string");
        assert.ok(room instanceof Room);
        done();
      });
    });

    it('shouldn\'t return when trying to join with invalid room id', function() {
      assert.equal(matchMaker.joinById('invalid_id', {}), undefined);
    });

    it('shouldn\'t create room when requesting to join room with invalid params', function(done) {
      matchMaker.onJoinRoomRequest('dummy_room', { invalid_param: 10 }, true, (err, room) => {
        assert.ok(typeof(err)==="string");
        assert.equal(room, undefined);
        done();
      })
    });

    it('shouldn\t return room instance when trying to join existing room by id with invalid params', function(done) {
      matchMaker.onJoinRoomRequest('room', {}, true, (err, room) => {
        assert.ok(room instanceof Room);
        assert.equal(matchMaker.joinById(room.roomId, { invalid_param: 1 }), undefined);
        done();
      });
    });

    it('should join existing room using "joinById"', function(done) {
      assert.equal(false, matchMaker.hasAvailableRoom('dummy_room'))

      matchMaker.onJoinRoomRequest('dummy_room', {}, true, (err, room) => {
        var joiningRoom = matchMaker.joinById(room.roomId, {});
        assert.equal(true, matchMaker.hasAvailableRoom('dummy_room'))
        assert.equal('dummy_room', room.roomName)
        assert.equal(room.roomId, joiningRoom.roomId)
        done();
      });
    });

    it('should call "onDispose" when room is not created', function(done) {
      const stub = sinon.stub(DummyRoom.prototype, 'requestJoin').returns(false);
      const spy = sinon.spy(DummyRoom.prototype, 'onDispose');
      const room = matchMaker.create('dummy_room', {});
      assert.ok(spy.calledOnce);
      assert.equal(null, room);
      stub.restore();
      done();
    });

    it('should emit error if room name is not a valid id', function(done) {
      const invalidRoomName = '';
      matchMaker.onJoinRoomRequest(invalidRoomName, {}, true, (err, room) => {
        assert.equal('join_request_fail', err);
        done();
      });
    });

  });
});
