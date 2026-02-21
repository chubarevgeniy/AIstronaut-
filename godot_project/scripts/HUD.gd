extends CanvasLayer

var ship: Node2D = null

# These paths must match the scene tree in HUD.tscn
@onready var alt_label = $Control/AltLabel
@onready var fuel_label = $Control/FuelLabel
@onready var pause_menu = $Control/PauseMenu

func _ready():
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
	queue_redraw() # Redraw indicator every frame

	if not is_instance_valid(ship): return

	if alt_label:
		alt_label.text = "ALT: %d LY" % Global.score

	if fuel_label:
		if ship.max_fuel == INF:
			fuel_label.text = "FUEL: INF"
		else:
			fuel_label.text = "FUEL: %d%%" % int((ship.fuel / ship.max_fuel) * 100)

func _draw():
	if not is_instance_valid(ship): return

	# Draw Indicator
	# Fix: Use surface distance (dist - radius)
	var planets = get_tree().get_nodes_in_group("planets")
	var nearest = null
	var min_surface_dist = INF

	for p in planets:
		var dist = ship.global_position.distance_to(p.global_position)
		var surface_dist = dist - p.radius
		if surface_dist < min_surface_dist:
			min_surface_dist = surface_dist
			nearest = p

	# Center of screen (Player position relative to Camera)
	var center = get_viewport().get_visible_rect().size / 2

	if nearest and min_surface_dist > 10.0 and min_surface_dist < 2000.0:
		var dir = (nearest.global_position - ship.global_position).normalized()
		var offset = dir * 60.0 # Indicator radius

		draw_circle(center + offset, 4.0, Color.RED)

		# Optional: Line to it
		# draw_line(center, center + offset, Color(1, 0, 0, 0.3), 1.0)
