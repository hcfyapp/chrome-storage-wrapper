describe( '完整测试。下面这些测试要按照顺序执行，所以没有分成多个 describe' , () => {

  it( 'sync 能同步数据' , done => {
    const data = { test : 1 , g : '2' };

    chromeStorage
      .set( data )
      .then( ()=> chromeStorage.sync() )
      .then( ()=> chromeStorage.getAll( 'sync' ) )
      .then( s => {
        expect( s ).toEqual( data );
        Promise.all( [
          chromeStorage.clear( 'local' ) ,
          chromeStorage.clear( 'sync' )
        ] ).then( done );
      } );
  } );

  it( '使用对象设置数据' , ( done ) => {
    chromeStorage.set( {
      key1 : 'value1'
    } ).then( () => {
      return chromeStorage.get( 'key1' );
    } ).then( ( itmes ) => {
      expect( itmes.key1 ).toBe( 'value1' );
      done();
    } );
  } );

  it( '使用两个参数设置数据' , ( done ) => {
    chromeStorage.set( 'key2' , 'value2' )
      .then( () => chromeStorage.get( 'key2' ) )
      .then( ( itmes ) => {
        expect( itmes.key2 ).toBe( 'value2' );
        done();
      } );
  } );

  it( '改变存储区域' , ( done ) => {
    chromeStorage.set( {
        key3 : 'value3'
      } , 'sync' )
      .then( () => chromeStorage.get( 'key3' , 'sync' ) )
      .then( ( items ) => {
        expect( items.key3 ).toBe( 'value3' );
        done();
      } );
  } );

  it( '测试使用数组读取多个值' , ( done ) => {
    chromeStorage.get( [ 'key1' , 'key2' ] )
      .then( ( items ) => {
        expect( items ).toEqual( {
          key1 : 'value1' ,
          key2 : 'value2'
        } );
        done();
      } );
  } );

  it( '测试 getAll：local 区域的数据应该匹配前面写入的数据' , ( done ) => {
    chromeStorage.getAll()
      .then( ( items ) => {
        expect( items ).toEqual( {
          key1 : 'value1' ,
          key2 : 'value2'
        } );
        done();
      } );
  } );

  it( '测试 getAll：sync 区域的数据应该匹配前面写入的数据' , ( done ) => {
    chromeStorage.getAll( 'sync' )
      .then( ( items ) => {
        expect( items ).toEqual( {
          key3 : 'value3'
        } );
        done();
      } );
  } );

  // 测试数据监听函数
  let spy1 ,
    listener1;

  it( '应该能监听到数据的变化' , ( done ) => {
    spy1 = jasmine.createSpy( 'spy1' );
    listener1 = chromeStorage.addChangeListener( ( changes , area ) => {
      spy1();
      if ( 1 === spy1.calls.count() ) {
        expect( changes ).toEqual( {
          key1 : 'value1 - changed'
        } );
        expect( area ).toBe( 'local' );
      }
    } );
    chromeStorage.set( 'key1' , 'value1 - changed' )
      .then( () => {
        setTimeout( done , 1000 );
      } );
  } );

  it( '应该能取消事件监听函数' , ( done ) => {
    chromeStorage.removeChangeListener( listener1 );

    chromeStorage.set( 'key1' , 'value1' )
      .then( () => {
        setTimeout( () => {
          expect( spy1.calls.count() ).toBe( 1 );
          done();
        } , 1000 );
      } );
  } );

  let spy2 ,
    listener2;

  it( '应该能使用第二个参数限定 change 事件的产生' , ( done ) => {
    spy2 = jasmine.createSpy( 'spy2' );
    listener2 = chromeStorage.addChangeListener( ( changes , area ) => {
      spy2();
      expect( changes ).toEqual( { key2 : 'value2 - changed' } );
      expect( area ).toBe( 'local' );
    } , {
      keys : 'key2' ,
      areas : 'local'
    } );

    chromeStorage.set( 'key1' , 'value1 - changed' )
      .then( () => {
        return new Promise( ( resolve ) => {
          setTimeout( () => {
            resolve( chromeStorage.set( 'key2' , 'value2 - changed' ) )
          } , 1000 );
        } );
      } )
      .then( () => {
        expect( spy2.calls.count() ).toBe( 1 );
        done();
      } );
  } );

  it( '同样应该能取消事件监听' , ( done ) => {
    chromeStorage.removeChangeListener( listener2 );

    chromeStorage.set( 'key1' , 'value1' )
      .then( () => {
        return new Promise( ( resolve ) => {
          setTimeout( () => {
            resolve( chromeStorage.set( 'key2' , 'value2' ) )
          } , 1000 );
        } );
      } )
      .then( () => {
        setTimeout( () => {
          expect( spy2.calls.count() ).toBe( 1 );
          done();
        } , 1000 );
      } );
  } );

  // 测试默认存储区域的设置
  it( '设置一个不存在的默认存储区域时会抛出错误' , () => {
    expect( () => {
      chromeStorage.defaultArea = 'hasNoThisStorage';
    } ).toThrow();
  } );

  it( '设置一个存在的存储区域' , ( done ) => {
    chromeStorage.defaultArea = 'sync';
    chromeStorage.get( 'key3' ).then( ( items ) => {
      expect( items.key3 ).toBe( 'value3' );
      done();
    } );
  } );

  it( '测试清空默认存储区域的数据' , ( done ) => {
    chromeStorage.clear()
      .then( () => {
        return chromeStorage.get( null );
      } )
      .then( ( items ) => {
        expect( items ).toEqual( {} );
      } )
      .then( () => {
        chromeStorage.defaultArea = 'local';
        return chromeStorage.clear();
      } )
      .then( () => {
        return chromeStorage.get( null );
      } )
      .then( ( items ) => {
        expect( items ).toEqual( {} );
      } )
      .then( done );
  } );
} );
