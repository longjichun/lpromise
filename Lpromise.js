
/*
* 1. 创建一个实例时，必须给一个函数 P，作为参数传入，该函数有resolve，reject，complete三个参数
* 2. 在构造函数内部创建resolve，reject，complete三个函数
* 3. 实例最后应当执行该函数P(resolve，reject，complete)
* 4. 每个实例都保存自己的resolveFn、rejectFn、completeFn对象，存储then订阅者，
* 5. 当实例内部执行P中的参数函数时，便发布消息给上述订阅者
 */
(function(root){
	var isFunction = function(fn) {
		return typeof fn == "function";
	}
	var isArray = function(){
		return Object.prototype.toString.call(arguments[0]) == "[object Array]";
	}

	var runFns = function(fns,data){
		var len = fns.length;
		for(var i =0;i<len;i++){
			if( isFunction(fns[i]) ) {
				fns[i](data);
			}
		}
	}

	function Lpromise(fn){
		if( !isFunction(fn) ) throw fn + "is not a function";
		var self = this;
		self.resolveDatas = [] , self.unRunDatas = [];
		self.state 		  = "loading";
		self.completed    = false , self.rejected = false, self.rejecteErr = null;

		//----------------------------------------   then订阅后，推入相应的subs中 start-----------------------------
		self.resolveFn   = {
			subs:[],
			add:function(fn) {
				//订阅所有then
				self.resolveFn.subs.push(fn);
				var unDataLen = self.unRunDatas.length;
				if( unDataLen ) {
					//没订阅之前就已产生了的数据,应在此处发布
					for(var i = 0;i< unDataLen; i++) {
						fn( self.unRunDatas[i] );
					}
				}
			}
		};
		self.rejectFn	 = {
			subs:[],
			add:function(fn) {
				self.rejectFn.subs.push(fn);
				if( self.rejected ) {
					// then订阅前就已经完成了，直接发布reject
					fn( self.rejecteErr );
				}						
			}
		};
		self.completeFn  = {
			subs:[],
			add:function(fn) {
				self.completeFn.subs.push(fn);
				if( self.completed ) {
					// then订阅前就已经完成了，直接发布complete
					fn( self.resolveDatas );
				}
			}
		};

		//----------------------------------------   then订阅后，推入相应的subs中 end-----------------------------


		//----------------------------------------  then中的三个参数函数 end--------------------------------------
		var resolve = function(data){
			if(self.completed || self.rejected) return;
			self.resolveDatas.push(data);

			var subFn = self.resolveFn.subs , len = subFn.length;
			if( len ) {
				//已有订阅， 发布所有订阅
				runFns( subFn , data );
			} else {
				// 暂时无订阅，将消息推入存储库
				self.unRunDatas.push(data);
			}
		};

		var reject = function(err){
			self.rejected = true;
			self.rejecteErr = err;
			if( self.rejectFn.subs.length ) {
				//已有订阅， 发布所有订阅
				runFns(self.rejectFn.subs , err);
			} else {
				//已同步触发complete，但是还没有被订阅
			}
		};

		var complete = function(){
			self.completed = true;
			if( self.completeFn.subs.length ) {
				//已有订阅， 发布所有订阅
				runFns(self.completeFn.subs , self.resolveDatas);
			} else {
				//已同步触发complete，但是还没有被订阅
			}
		};

		//----------------------------------------  then中的三个参数函数 start-------------------------------------

		fn(resolve , reject , complete);
	}

	Lpromise.prototype.then = function(){
		//订阅
		var self = this;

		var arg = arguments;
		var resolveFn = arg[0] , rejectFn = arg[1] , completeFn = arg[2];

		if( isFunction(resolveFn) ) {
			// 存订阅
			self.resolveFn.add( resolveFn );
		}

		if( isFunction(rejectFn) ) {
			// 存订阅
			self.rejectFn.add(rejectFn);
		}

		if( isFunction(completeFn) ) {
			// 存订阅
			self.completeFn.add(completeFn);
		}

	};

	var multiPromise = function(type){
		// all 或者 race
		return function(){
			var self = this;
			var args = arguments[0] , len = args.length;
			if( !isArray(args) || !len ) throw args + "is not a useful Array";

			var completedNum = 0;
			var datas = [];
			var _p = new Lpromise(function(resolve,reject,complete){
				for(var i = 0;i<args.length;i++) {
					datas[i] = [];
					(function(p,i){
						p.then(
							function(res){
								datas[i].push(res);
							},
							function(err){
								reject(err);
							},
							function(){
								completedNum++;
								if( completedNum == len && type == "all" ){
									resolve(datas);
									complete();
								}

								if(completedNum==1 && type == "race") {
									resolve(datas);
									complete();
								}										
						})

					}(args[i],i))
				}
			});
			return _p;
		}
	}

	Lpromise.all = multiPromise( "all" );
	Lpromise.race = multiPromise( "race" );

	if( typeof module != 'undefined' && module.exports && exports) {
		module.exports = Lpromise;
	} else {
		root.Lpromise = Lpromise;
	}


}(this));