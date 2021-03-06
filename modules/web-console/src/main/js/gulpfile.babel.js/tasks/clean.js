/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import gulp from 'gulp';
import ignore from 'gulp-ignore';
import clean from 'gulp-rimraf';

import { destDir, igniteModulesTemp } from '../paths';

// Clean build folder, remove files.
gulp.task('clean', () =>
    gulp.src(`${ destDir }/*`, {read: false})
        .pipe(ignore('jspm_packages'))
        .pipe(ignore('system.config.js'))
        .pipe(clean({ force: true }))
);

gulp.task('clean:ignite-modules-temp', () =>
    gulp.src(igniteModulesTemp, {read: false})
        .pipe(clean({ force: true }))
);
