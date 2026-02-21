extends CanvasLayer

var ship: Node2D = null

# These paths must match the scene tree in HUD.tscn
@onready var alt_label = $Control/AltLabel
@onready var fuel_label = $Control/FuelLabel
@onready var pause_menu = $Control/PauseMenu

# Dynamic child for drawing
var drawer: Control = null

func _ready():
	# Create and add the drawer
	drawer = Control.new()
	drawer.set_script(load("res://scripts/HUDDrawer.gd"))
	drawer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	drawer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	$Control.add_child(drawer)

	# Assuming Sliders are in the PauseMenu
	if pause_menu:
		var master = pause_menu.find_child("MasterSlider", true, false)
		if master: master.value_changed.connect(func(v): Global.update_volume("Master", v))

		var music = pause_menu.find_child("MusicSlider", true, false)
		if music: music.value_changed.connect(func(v): Global.update_volume("Music", v))

		var sfx = pause_menu.find_child("SFXSlider", true, false)
		if sfx: sfx.value_changed.connect(func(v): Global.update_volume("SFX", v))

func _unhandled_input(event):
	if event.is_action_pressed("ui_cancel"):
		var tree = get_tree()
		tree.paused = not tree.paused
		Global.is_paused = tree.paused
		pause_menu.visible = tree.paused

func _process(delta):
	if not is_instance_valid(ship): return

	# Pass ship ref to drawer
	if drawer:
		drawer.ship = ship

	if alt_label:
		alt_label.text = "ALT: %d LY" % Global.score

	if fuel_label:
		if ship.max_fuel == INF:
			fuel_label.text = "FUEL: INF"
		else:
			fuel_label.text = "FUEL: %d%%" % int((ship.fuel / ship.max_fuel) * 100)
