extends Node2D

@export var ship_scene: PackedScene
@export var planet_scene: PackedScene
@export var fuel_scene: PackedScene
@export var hud_scene: PackedScene

var ship
var hud
var menu_layer
var level_generator = preload("res://scripts/LevelGenerator.gd").new()
var menu_script = preload("res://scripts/Menu.gd")

func _ready():
	# Load resources if not set
	if not ship_scene: ship_scene = load("res://scenes/Ship.tscn")
	if not planet_scene: planet_scene = load("res://scenes/Planet.tscn")
	if not fuel_scene: fuel_scene = load("res://scenes/FuelItem.tscn")
	if not hud_scene: hud_scene = load("res://scenes/HUD.tscn")

	# Create Menu Layer
	menu_layer = menu_script.new()
	menu_layer.process_mode = Node.PROCESS_MODE_ALWAYS # Always process menu
	add_child(menu_layer)

	# Connect Menu Signals
	menu_layer.start_game.connect(_on_menu_start_game)
	menu_layer.resume_game.connect(_on_menu_resume)
	menu_layer.restart_game.connect(_on_menu_restart)
	menu_layer.exit_game.connect(_on_menu_exit)

	# Start in Menu state
	Global.is_game_over = true # Treat as game over initially to stop processing
	get_tree().paused = true
	menu_layer.show_start_screen()

func start_game(mode, start_ly = 0):
	Global.game_mode = mode

	# Clear old nodes
	if is_instance_valid(ship): ship.queue_free()
	if is_instance_valid(hud): hud.queue_free()

	# Clear world objects (Planets, Fuel) but keep generator state if needed
	# Actually, get_children() includes MenuLayer now. We must filter.
	for c in get_children():
		if c == menu_layer: continue
		c.queue_free()

	var start_y = -start_ly * 100.0
	level_generator.reset(start_y)
	Global.score = start_ly
	Global.is_game_over = false
	Global.is_paused = false

	# Spawn Ship
	ship = ship_scene.instantiate()
	ship.position = Vector2(0, start_y)
	ship.max_fuel = INF if mode == 1 else 100.0
	ship.fuel = ship.max_fuel

	# Connect ship signals
	ship.game_over.connect(_on_ship_game_over)

	add_child(ship)

	# Camera
	var cam = Camera2D.new()
	cam.position_smoothing_enabled = true
	ship.add_child(cam)
	cam.make_current()

	# HUD
	hud = hud_scene.instantiate()
	hud.ship = ship
	add_child(hud)

	# Initial Planet (only if starting at 0)
	if start_ly == 0:
		var starter = planet_scene.instantiate()
		starter.position = Vector2(180, -100)
		starter.radius = 80
		starter.type = "ice"
		add_child(starter)

	# Initial Generation
	level_generator.generate_chunks(ship.global_position, self, planet_scene)

	# Unpause and hide menu
	get_tree().paused = false
	menu_layer.hide_menu()

func _process(delta):
	if Global.is_game_over:
		return

	if Input.is_action_just_pressed("ui_cancel"): # Escape/Back
		_on_pause_requested()

	if is_instance_valid(ship):
		level_generator.generate_chunks(ship.global_position, self, planet_scene)
		level_generator.generate_items(ship.global_position.y, self, fuel_scene)
		level_generator.cleanup(ship.global_position, self)

# Menu Callbacks
func _on_menu_start_game(mode, start_ly):
	start_game(mode, start_ly)

func _on_menu_resume():
	get_tree().paused = false
	menu_layer.hide_menu()

func _on_menu_restart():
	start_game(Global.game_mode)

func _on_menu_exit():
	get_tree().paused = true
	if is_instance_valid(ship): ship.queue_free()
	menu_layer.show_start_screen()

func _on_pause_requested():
	get_tree().paused = true
	menu_layer.show_pause_screen()

func _on_ship_game_over():
	Global.is_game_over = true

	# Save High Score
	if Global.game_mode == 0:
		if Global.score > Global.high_score_survival:
			Global.high_score_survival = Global.score
	else:
		if Global.score > Global.high_score_zen:
			Global.high_score_zen = Global.score
	Global.save_data()

	# Show Game Over Screen
	# Small delay?
	await get_tree().create_timer(1.0).timeout
	get_tree().paused = true
	menu_layer.show_game_over_screen(Global.score)
