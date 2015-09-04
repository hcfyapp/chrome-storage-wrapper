'use strict';

const gulp = require( 'gulp' ) ,
      cpe  = require( 'gulp-es6-sass' )( gulp , {
          es6Files : [ './*.es6' ] ,
          sassFiles : []
      } );
