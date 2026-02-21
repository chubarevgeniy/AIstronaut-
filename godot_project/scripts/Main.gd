extends Node2D

@export var ship_scene: PackedScene
@export var planet_scene: PackedScene
@export var fuel_scene: PackedScene
@export var hud_scene: PackedScene

var ship
var hud
var level_generator = preload("res://scripts/LevelGenerator.gd").new()

func _ready():
	# Load resources if not set
	if not ship_scene: ship_scene = load("res://scenes/Ship.tscn")
	if not planet_scene: planet_scene = load("res://scenes/Planet.tscn")
	if not fuel_scene: fuel_scene = load("res://scenes/FuelItem.tscn")
	if not hud_scene: hud_scene = load("res://scenes/HUD.tscn")

	start_game()

func start_game():
	# Clear old nodes (Planets, Fuel, Ship, HUD)
	# Be careful not to delete LevelGenerator if it was a node
	for c in get_children():
		c.queue_free()

	level_generator.reset()
	Global.score = 0
	Global.is_game_over = false

	# Spawn Ship
	ship = ship_scene.instantiate()
	add_child(ship)

	# Camera
	var cam = Camera2D.new()
	cam.position_smoothing_enabled = true # Smooth camera
	ship.add_child(cam)
	cam.make_current()

	# HUD
	hud = hud_scene.instantiate()
	hud.ship = ship
	add_child(hud)

	# Initial Planet (Starter)
	var starter = planet_scene.instantiate()
	starter.position = Vector2(180, -100)
	starter.radius = 80
	starter.type = "ice"
	add_child(starter)

	# Initial Generation
	level_generator.generate_chunks(Vector2.ZERO, self, planet_scene)

func _process(delta):
	if Global.is_game_over:
		if Input.is_action_just_pressed("ui_accept") or Input.is_action_just_pressed("thrust"):
			start_game()
		return

	if is_instance_valid(ship):
		level_generator.generate_chunks(ship.global_position, self, planet_scene)
		level_generator.generate_items(ship.global_position.y, self, fuel_scene)
		level_generator.cleanup(ship.global_position, self)
