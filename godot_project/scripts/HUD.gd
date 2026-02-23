extends CanvasLayer

var ship: Node2D = null:
	set(value):
		ship = value
		if is_inside_tree() and ship and ship.has_signal("fuel_gained"):
			if not ship.fuel_gained.is_connected(_on_fuel_gained):
				ship.fuel_gained.connect(_on_fuel_gained)

# These paths must match the scene tree in HUD.tscn
@onready var alt_label = $Control/AltLabel
@onready var fuel_label = $Control/FuelLabel
@onready var pause_menu = $Control/PauseMenu

# Dynamic child for drawing
var drawer: Control = null
var fuel_bar: ProgressBar = null
var tween: Tween = null

func _ready():
	# Create Fuel Bar
	fuel_bar = ProgressBar.new()
	fuel_bar.show_percentage = false
	fuel_bar.position = Vector2(10, 85)
	fuel_bar.size = Vector2(150, 10)

	# Style the bar (White fill)
	var style_box = StyleBoxFlat.new()
	style_box.bg_color = Color.WHITE
	fuel_bar.add_theme_stylebox_override("fill", style_box)

	$Control.add_child(fuel_bar)

	# Create and add the drawer
	drawer = Control.new()
	drawer.set_script(load("res://scripts/HUDDrawer.gd"))
	drawer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	drawer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	$Control.add_child(drawer)

	# Connect signal if ship is already set
	if ship and ship.has_signal("fuel_gained"):
		if not ship.fuel_gained.is_connected(_on_fuel_gained):
			ship.fuel_gained.connect(_on_fuel_gained)

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
			if fuel_bar: fuel_bar.visible = false
		else:
			fuel_label.text = "FUEL: %d%%" % int((ship.fuel / ship.max_fuel) * 100)
			if fuel_bar:
				fuel_bar.visible = true
				fuel_bar.max_value = ship.max_fuel
				fuel_bar.value = ship.fuel

				# Orange when burning (thrusting)
				if ship.is_thrusting:
					fuel_bar.self_modulate = Color(1, 0.5, 0) # Orange
				else:
					fuel_bar.self_modulate = Color.WHITE

func _on_fuel_gained():
	if not fuel_bar: return

	# Green flash animation
	if tween: tween.kill()
	tween = create_tween()
	tween.tween_property(fuel_bar, "modulate", Color(0, 1, 0), 0.1) # Flash Green
	tween.tween_property(fuel_bar, "modulate", Color.WHITE, 0.3) # Back to normal
