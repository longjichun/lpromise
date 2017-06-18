var should = require("should")
var Lpromise = require("./Lpromise");
describe("long promise test",function(){
	var x = 3;
	var p0 = new Lpromise(function(resolve,reject,complete){
		resolve("000");
		complete();
	});
	var p1 = new Lpromise(function(resolve,reject,complete){
		resolve(3);   
		setTimeout(function(){
			resolve(4);
			complete();
		},500)
	});

	var p2 = new Lpromise(function(resolve,reject,complete){
		setTimeout(function(){
			reject("p2 error");
		},600)
	});

	it("任意实例都应当有一些属性和方法",function(){
		p0.should.have.property("resolveDatas").which.is.a.Array();
		p0.should.have.property("unRunDatas").which.is.a.Array();
		p0.should.have.property("completed").which.is.a.Boolean();
		p0.should.have.property("rejected").which.is.a.Boolean();
		p0.should.have.property("rejecteErr").which.is.a.null();
		p0.should.have.property("then").which.is.a.Function();

		p0.should.have.property("resolveFn").which.is.a.Object();
		p0.should.have.property("rejectFn").which.is.a.Object();
		p0.should.have.property("completeFn").which.is.a.Object();
	})

	it("同步resolve的实例p0进行订阅后，应当能立即得到反馈，反馈信息为同步resolve的数据",function(){
		var resolveData = p0.resolveDatas[0];
		p0.resolveFn.add(function(data){
			resolveData.should.be.equal(data);
		});
	});

	it("实例p1订阅三类消息之后，实例属性subs应当得到反馈",function(){
		var resolveDatas = [];
		var resolveFn = function(resolve){};
		p1.then(resolveFn,function(){},function(){});

		p1.resolveFn.subs.length.should.be.equal(1);
		p1.rejectFn.subs.length.should.be.equal(1);
		p1.completeFn.subs.length.should.be.equal(1);

		resolveFn.should.be.equal(p1.resolveFn.subs[0])
	});

	it("实例p1收到订阅的消息应当与resolve的一致",function(done){
		var times = 0 , dataStr = JSON.stringify([3,4]);
		p1.then(function(res){
			times++;
			if(times == 1) {
				res.should.be.equal(3);
			}
			if(times == 2) {
				res.should.be.equal(4);
			}
		},function(){

		},function(res){
			var resStr = JSON.stringify(res);
			resStr.should.be.equal(dataStr);
			done();
		});
	});

	it("实例p2被reject后，应当收到错误信息",function(done){
		p2.then(function(){},function(err){
			err.should.be.equal("p2 error");
			done();
		});
	});

	it("Lpromise 应当有all和race两个方法",	function(){
		Lpromise.should.have.property("all").which.is.a.Function();
		Lpromise.should.have.property("race").which.is.a.Function();
	});

	it("Lpromise 的all被reject",function(done){
		Lpromise.all([p0,p1,p2]).then(function(res){
		},function(err){
			err.should.be.equal("p2 error");
			done();
		},function(){
		});
	});


	var p3 = new Lpromise(function(resolve,reject,complete){
		resolve("000");
		complete();
	});
	var p4 = new Lpromise(function(resolve,reject,complete){
		resolve(3);   
		setTimeout(function(){
			resolve(4);
			complete();
		},500)
	});
	var p5 = new Lpromise(function(resolve,reject,complete){
		reject("p5 error")
	})
	it("Lpromise 的all 完成",function(done){
		Lpromise.all([p3,p4,p5]).then(function(res){

		},function(err){
			err.should.be.equal("p5 error");
		},function(res){});

		Lpromise.all([p3,p4]).then(function(res){
			JSON.stringify(res[0]).should.be.equal('["000"]');
			JSON.stringify(res[1]).should.be.equal('[3,4]');
		},function(){},function(res){
			JSON.stringify(res[0][0]).should.be.equal('["000"]');
			JSON.stringify(res[0][1]).should.be.equal('[3,4]');
			done()
		})		
	})
})