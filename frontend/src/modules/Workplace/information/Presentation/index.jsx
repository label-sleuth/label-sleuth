/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import * as React from 'react';
import close_icon from './../../Asset/close.svg';
import { APP_NAME } from '../../../../config';

const close_introSlides = function(){
  document.getElementById("presentation").style.display = "none";
}

export default function Presentation() {
  return (
    <div id="presentation">
      <div>
        <div className="exit_modal" onClick={close_introSlides}><img src={close_icon} alt="close info"/></div>
        <label>System for Learning to Understand Text with Human-in-the-loop</label>
        <h2>{APP_NAME}</h2>
        <p>Data is the new oil of the digital era - when it is processed, analyzed and utilized efficiently and instantly, it will have a much greater value. We have a number of pain points for the current process:</p>
        <ul>
          <li>Limited technical expertise</li>
          <li>Human time and effort required</li>
          <li>Lack of transparency</li>
        </ul>
        <h4>Our Approach</h4>
        <p>Sleuth aims to simplify and accelerate the generation of language models by bringing the human into the loop. Our solution will leverage, combine and further enhance the SOTA of various NLP models, and human-in-the-loop approaches, with the goal of creating a unified system for developing NLP algorithms with SMEs (Subject Matter Experts).</p>
      </div>
    </div>
  )
}