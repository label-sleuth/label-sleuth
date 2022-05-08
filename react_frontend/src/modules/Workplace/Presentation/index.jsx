import * as React from 'react';
import close_icon from './../Asset/close.svg';

var open_intro_modal = false;

const close_introSlides = function(){
  document.getElementById("presentation").style.display = "none";
}

export default function Presentation() {
  return (
    <div id="presentation">
      <div>
        <div class="exit_modal" onClick={close_introSlides}><img src={close_icon} alt="close info"/></div>
        <label>Presentation Label</label>
        <h2>Presentation Title</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    </div>
  )
}