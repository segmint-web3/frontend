<template>
	<input ref="colorPickerRef" type="color" value="#000">
	<svg ref="canvasRef" class="canvas" width="1001" height="1001" xmlns="http://www.w3.org/2000/svg"> 
		<defs> 
			<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
				<path d="M 20 0 L 0 0 0 20" fill="none" stroke="gray" stroke-width="1" /> 
			</pattern> 
		</defs> 
		<rect width="1001" height="1001" fill="url(#grid)" /> 
	</svg>
</template>
<script setup>
import { ref, onMounted } from 'vue';
const canvasRef = ref(null);
const colorPickerRef = ref(null);

// function randomColor() { 
// 	let r = Math.floor(Math.random() * 256); 
// 	let g = Math.floor(Math.random() * 256); 
// 	let b = Math.floor(Math.random() * 256); 
// 	return `rgb(${r}, ${g}, ${b})`; 
// }

function getCellCoordinates(x, y) {
  let cellX = Math.floor(x / 20) * 20;
  let cellY = Math.floor(y / 20) * 20;
  return [cellX, cellY];
}

function createAndAppendRect(x, y, color, canvas) {
  let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", 20);
  rect.setAttribute("height", 20);
  rect.setAttribute("fill", color);
  canvas.appendChild(rect);
}

onMounted(() => {{
	const canvas = canvasRef.value;
	const colorPicker = colorPickerRef.value;
	canvas.addEventListener("click", function(event) {
		// Получаем координаты клика относительно svg элемента
		let x = event.clientX - canvas.getBoundingClientRect().left;
		let y = event.clientY - canvas.getBoundingClientRect().top;

		// Получаем координаты ячейки по координатам клика
		let [cellX, cellY] = getCellCoordinates(x, y);

		// let color = randomColor();
		let color = colorPicker.value;

		// Создаем и добавляем прямоугольник с заданными координатами и цветом
		createAndAppendRect(cellX, cellY, color, canvas);
	});
}})

defineExpose({
  canvasRef
})
</script>
<style>
input {
  display: block;
  margin: 10px auto;
}
</style>
