'use strict';

const gulp = require( 'gulp' ) ,
      cpe  = require( 'gulp-es6-sass' )( gulp , {
          src : './src' ,
          es6Files : [ './src/*.es6' ] ,
          sassFiles : []
      } );
