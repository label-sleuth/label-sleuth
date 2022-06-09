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