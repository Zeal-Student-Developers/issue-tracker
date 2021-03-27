const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");

const JwtService = require("../../../services/JwtService");
const jwt = require("jsonwebtoken");

describe("JwtService", () => {
  describe("sign()", () => {
    let stub;
    beforeEach(() => {
      stub = sinon.stub(jwt, "sign");
    });

    afterEach(() => {
      stub.restore();
    });

    it("signs non-empty payload and returns a jwt token.", () => {
      stub.returns({});

      const token = JwtService.sign({ foo: "bar" });

      expect(stub.calledOnce).to.be.true;
      expect(token).to.be.deep.equal({});
    });

    it("throws an Error if jwt.sign returns an error.", () => {
      stub.throws();
      let token;
      try {
        token = JwtService.sign({ foo: "bar" });
      } catch (e) {}

      expect(stub.calledOnce).to.be.true;
      expect(stub).to.throw();
      expect(token).to.be.undefined;
    });

    it("throws an Error if payload is null or undefined.", () => {
      stub.returns({});
      let token, error;
      try {
        token = JwtService.sign();
      } catch (e) {
        error = e;
      }

      expect(stub.called).to.be.false;
      expect(token).to.be.undefined;
      expect(error.message).to.eql(
        "Payload must be a valid object with one or more properties"
      );
    });
  });

  describe("verify()", () => {
    let stub;
    beforeEach(() => {
      stub = sinon.stub(jwt, "verify");
    });

    afterEach(() => {
      stub.restore();
    });

    it("returns an object if jwt.verify verifies and returns.", () => {
      stub.returns({});

      const token = JwtService.verify(
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.Et9HFtf9R3GEMA0IICOfFMVXY7kkTX1wr4qCyhIf58U"
      );

      expect(stub.calledOnce).to.be.true;
      expect(token).to.be.deep.equal({});
    });

    it("throws an Error if jwt.verify returns an error.", () => {
      stub.throws();
      let payload;
      try {
        payload = JwtService.verify(
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.Et9HFtf9R3GEMA0IICOfFMVXY7kkTX1wr4qCyhIf58U"
        );
      } catch (e) {}

      expect(stub.calledOnce).to.be.true;
      expect(stub).to.throw();
      expect(payload).to.be.undefined;
    });

    it("throws an Error if payload is undefined.", () => {
      stub.returns({});
      let payload, error;
      try {
        payload = JwtService.verify();
      } catch (e) {
        error = e;
      }

      expect(stub.called).to.be.false;
      expect(payload).to.be.undefined;
      expect(error.message).to.eql(
        "Authorization header must contain a valid JWT token"
      );
    });
  });

  describe("decode()", () => {
    let stub;
    beforeEach(() => {
      stub = sinon.stub(jwt, "decode");
    });

    afterEach(() => {
      stub.restore();
    });

    it("returns an object if jwt.decode decodes and returns.", () => {
      stub.returns({});

      const token = JwtService.decode(
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.Et9HFtf9R3GEMA0IICOfFMVXY7kkTX1wr4qCyhIf58Us"
      );

      expect(stub.calledOnce).to.be.true;
      expect(token).to.be.deep.equal({});
    });

    it("throws an Error if jwt.decode returns an error.", () => {
      stub.throws();
      let payload;
      try {
        payload = JwtService.decode(
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.Et9HFtf9R3GEMA0IICOfFMVXY7kkTX1wr4qCyhIf58U"
        );
      } catch (e) {}

      expect(stub.calledOnce).to.be.true;
      expect(stub).to.throw();
      expect(payload).to.be.undefined;
    });

    it("throws an Error if payload is undefined.", () => {
      stub.returns({});
      let payload, error;
      try {
        payload = JwtService.decode();
      } catch (e) {
        error = e;
      }

      expect(stub.called).to.be.false;
      expect(payload).to.be.undefined;
      expect(error.message).to.eql(
        "Authorization header must contain a valid JWT token"
      );
    });
  });
});
