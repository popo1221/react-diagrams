import { AbstractDisplacementState, AbstractDisplacementStateEvent } from '../core-state/AbstractDisplacementState';
import { State } from '../core-state/State';
import { SelectionLayerModel } from '../entities/selection/SelectionLayerModel';
import { BasePositionModel } from '../core-models/BasePositionModel';
import { Rectangle } from '@projectstorm/geometry';
import { LinkModel } from '@projectstorm/react-diagrams-core';

export class SelectionBoxState extends AbstractDisplacementState {
	layer: SelectionLayerModel;

	constructor() {
		super({
			name: 'selection-box'
		});
	}

	activated(previous: State) {
		super.activated(previous);
		this.layer = new SelectionLayerModel();
		this.engine.getModel().addLayer(this.layer);
	}

	deactivated(next: State) {
		super.deactivated(next);
		this.layer.remove();
		this.engine.repaintCanvas();
	}

	getBoxDimensions(event: AbstractDisplacementStateEvent): ClientRect {
		const rel = this.engine.getRelativePoint(event.event.clientX, event.event.clientY);

		return {
			left: rel.x > this.initialXRelative ? this.initialXRelative : rel.x,
			top: rel.y > this.initialYRelative ? this.initialYRelative : rel.y,
			width: Math.abs(rel.x - this.initialXRelative),
			height: Math.abs(rel.y - this.initialYRelative),
			right: rel.x < this.initialXRelative ? this.initialXRelative : rel.x,
			bottom: rel.y < this.initialYRelative ? this.initialYRelative : rel.y
		};
	}

	fireMouseMoved(event: AbstractDisplacementStateEvent) {
		this.layer.setBox(this.getBoxDimensions(event));

		const relative = this.engine.getRelativeMousePoint({
			clientX: this.initialX,
			clientY: this.initialY
		});
		if (event.virtualDisplacementX < 0) {
			relative.x -= Math.abs(event.virtualDisplacementX);
		}
		if (event.virtualDisplacementY < 0) {
			relative.y -= Math.abs(event.virtualDisplacementY);
		}
		const rect = new Rectangle(relative, Math.abs(event.virtualDisplacementX), Math.abs(event.virtualDisplacementY));

		for (let model of this.engine.getModel().getSelectionEntities()) {
			if (model instanceof BasePositionModel) {
				if (rect.containsPoint(model.getPosition())) {
					model.setSelected(true);
				}
			} else if (model instanceof LinkModel) {
				const inRect = !(<LinkModel>model).getPoints().some(point => !rect.containsPoint(point.getPosition()));
				if (inRect) {
					model.setSelected(true);
				}
			}
		}

		this.engine.repaintCanvas();
	}
}
