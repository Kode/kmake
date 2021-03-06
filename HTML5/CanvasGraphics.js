"use strict";

define(['Color', 'Graphics'], function (Color, Graphics) {
	class CanvasGraphics extends Graphics {
		constructor(canvas, width, height) {
			super();
			this.canvas = canvas;
			this.width = width;
			this.height = height;
			CanvasGraphics.instance = this;
			this.myColor = Color.fromBytes(0, 0, 0);
			canvas.save();
			//webfont = new Font("Arial", new FontStyle(false, false, false), 12);
			//canvas.globalCompositeOperation = "normal";
		}
		
		static stringWidth(font, text) {
			if (CanvasGraphics.instance == null) return 5 * text.length;
			else {
				CanvasGraphics.instance.font = font;
				return CanvasGraphics.instance.canvas.measureText(text).width;
			}
		}
		
		begin(clear /*= true*/, clearColor /*= null*/) {
			if (clear) this.clear(clearColor);
		}
		
		clear(color /*= null*/) {
			if (color === null || color === undefined) color = Color.Black;
			this.canvas.strokeStyle = "rgb(" + color.Rb + "," + color.Gb + "," + color.Bb + ")";
			this.canvas.fillStyle = "rgb(" + color.Rb + "," + color.Gb + "," + color.Bb + ")";
			this.canvas.fillRect(0, 0, this.width, this.height);
			this.color = this.myColor;
		}
		
		end() {
			
		}
		
		/*override public function translate(x: Float, y: Float) {
			tx = x;
			ty = y;
		}*/
		
		drawImage(img, x, y) {
			this.canvas.globalAlpha = this.opacity;
			this.canvas.drawImage(img, x, y);
			this.canvas.globalAlpha = 1;
		}
		
		drawScaledSubImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
			this.canvas.globalAlpha = this.opacity;
			try {
				if (dw < 0 || dh < 0) {
					this.canvas.save();
					this.canvas.translate(dx, dy);
					var x = 0.0;
					var y = 0.0;
					if (dw < 0) {
						this.canvas.scale(-1, 1);
						x = -dw;
					}
					if (dh < 0) {
						this.canvas.scale(1, -1);
						y = -dh;
					}
					this.canvas.drawImage(image, sx, sy, sw, sh, x, y, dw, dh);
					this.canvas.restore();
				}
				else {
					this.canvas.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
				}
			}
			catch (ex) {
				
			}
			this.canvas.globalAlpha = 1;
		}
		
		set color(color) {
			this.myColor = color;
			this.canvas.strokeStyle = "rgb(" + color.Rb + "," + color.Gb + "," + color.Bb + ")";
			this.canvas.fillStyle = "rgb(" + color.Rb + "," + color.Gb + "," + color.Bb + ")";
		}
		
		get color() {
			return this.myColor;
		}
		
		get imageScaleQuality() {
			return this.scaleQuality;
		}
		
		set imageScaleQuality(value) {
			if (value === ImageScaleQuality.Low) {
				this.canvas.mozImageSmoothingEnabled = false;
				this.canvas.webkitImageSmoothingEnabled = false;
				this.canvas.msImageSmoothingEnabled = false;
				this.canvas.imageSmoothingEnabled = false;
			}
			else {
				this.canvas.mozImageSmoothingEnabled = true;
				this.canvas.webkitImageSmoothingEnabled = true;
				this.canvas.msImageSmoothingEnabled = true;
				this.canvas.imageSmoothingEnabled = true;
			}
			this.scaleQuality = value;
		}
		
		drawRect(x, y, width, height, strength /*= 1.0*/) {
			if (strength === undefined) strength = 1.0;
			this.canvas.beginPath();
			let oldStrength = this.canvas.lineWidth;
			this.canvas.lineWidth = Math.round(strength);
			this.canvas.rect(x, y, width, height);
			this.canvas.stroke();
			this.canvas.lineWidth = oldStrength;
		}
		
		fillRect(x, y, width, height) {
			this.canvas.globalAlpha = this.opacity * this.myColor.A;
			this.canvas.fillRect(x, y, width, height);
			this.canvas.globalAlpha = this.opacity;
		}
		
		drawString(text, x, y) {
			this.canvas.fillText(text, x, y + this.webfont.getHeight());
		}

		set font(font) {
			this.webfont = font;
			this.canvas.font = this.webfont.size + "px " + this.webfont.name;
		}
		
		get font() {
			return this.webfont;
		}

		drawLine(x1, y1, x2, y2, strength /*= 1.0*/) {
			if (strength === undefined) strength = 1.0;
			this.canvas.beginPath();
			var oldWith = this.canvas.lineWidth;
			this.canvas.lineWidth = Math.round(strength);
			this.canvas.moveTo(x1, y1);
			this.canvas.lineTo(x2, y2);
			this.canvas.moveTo(0, 0);
			this.canvas.stroke();
			this.canvas.lineWidth = oldWith;
		}

		fillTriangle(x1, y1, x2, y2, x3, y3) {
			this.canvas.beginPath();
			
			this.canvas.closePath();
			this.canvas.fill();
		}
		
		scissor(x, y, width, height) {
			this.canvas.beginPath();
			this.canvas.rect(x, y, width, height);
			this.canvas.clip();
		}
		
		disableScissor() {
			this.canvas.restore();
		}
		
		drawVideo(video, x, y, width, height) {
			this.canvas.drawImage(video.element, x, y, width, height);
		}
		
		setTransformation(transformation) {
			this.canvas.setTransform(transformation._00, transformation._01, transformation._10,
				transformation._11, transformation._20, transformation._21);
		}
	}

	return CanvasGraphics;
});
