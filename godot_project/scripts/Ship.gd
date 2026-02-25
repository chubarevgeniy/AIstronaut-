extends CharacterBody2D

signal fuel_empty
signal game_over
signal fuel_gained

var fuel: float = 100.0
var max_fuel: float = 100.0
var rotation_speed: float = 5.0
var is_thrusting: bool = false
var has_ejected: bool = false
var near_miss_timer: float = 0.0
var is_landed: bool = false
var landed_planet = null

func _ready():
	add_to_group("player")
	velocity = Vector2(0, -60) # Initial velocity

func _physics_process(delta):
	if Global.is_game_over or Global.is_paused:
		return

	if is_landed and is_instance_valid(landed_planet):
		if Input.is_action_pressed("thrust") and (fuel > 0 or max_fuel == INF):
			is_landed = false
			landed_planet = null
			velocity = Vector2.UP.rotated(rotation) * 100.0
		else:
			velocity = Vector2.ZERO
			return

	# Gravity
	var planets = get_tree().get_nodes_in_group("planets")
	var gravity_force = Vector2.ZERO

	for planet in planets:
		var dist_sq = global_position.distance_squared_to(planet.global_position)
		var dist = sqrt(dist_sq)

		# Collision Check
		if planet.type != "asteroid":
			if dist < planet.radius + GameConfig.SHIP_COLLISION_RADIUS:
				if velocity.length() < GameConfig.LANDING_MAX_SPEED:
					land(planet)
					return
				else:
					die()
					return

		if dist > 10 and dist < planet.gravity_radius:
			# Skip asteroids (handled by gravity_radius=0 but explicit check is fine)
			if planet.type == "asteroid": continue

			var force_mag = (GameConfig.GRAVITY_CONSTANT * planet.mass) / dist_sq
			var dir = (planet.global_position - global_position).normalized()

			var force = dir * force_mag

			# Black Hole special
			if planet.type == "black_hole":
				force *= 3.0
				if max_fuel != INF:
					add_fuel(50 * delta)

			# Near Miss Bonus (High speed close pass)
			if planet.type != "asteroid" and near_miss_timer <= 0:
				# Check if close (radius + ship_size + margin) and fast
				if dist < planet.radius + 60.0 and velocity.length() > GameConfig.NEAR_MISS_SPEED_THRESHOLD:
					add_fuel(GameConfig.NEAR_MISS_FUEL_REWARD)
					near_miss_timer = GameConfig.NEAR_MISS_COOLDOWN

			# Star special (Heat Zone)
			if planet.type == "star":
				if dist < planet.gravity_radius / 3.0:
					if max_fuel != INF:
						fuel -= GameConfig.STAR_FUEL_BURN_RATE * delta

			gravity_force += force

	if near_miss_timer > 0:
		near_miss_timer -= delta

	# Thrust
	var thrust_force = Vector2.ZERO
	if Input.is_action_pressed("thrust") and (fuel > 0 or max_fuel == INF):
		is_thrusting = true
		if max_fuel != INF:
			fuel -= 10 * delta
			if fuel <= 0:
				fuel_empty.emit()

		# Find Nearest (Planet or Fuel)
		var nearest_obj = null
		var min_surface_dist = INF

		# Check Planets
		for planet in planets:
			var dist = global_position.distance_to(planet.global_position)
			var surface_dist = dist - planet.radius
			if surface_dist < min_surface_dist:
				min_surface_dist = surface_dist
				nearest_obj = planet

		# Check Fuel Items
		var fuel_items = get_tree().get_nodes_in_group("fuel")
		for item in fuel_items:
			var dist = global_position.distance_to(item.global_position)
			var surface_dist = dist - item.radius
			if surface_dist < min_surface_dist:
				min_surface_dist = surface_dist
				nearest_obj = item

		if nearest_obj and min_surface_dist < 2000:
			var dir = (nearest_obj.global_position - global_position).normalized()
			if nearest_obj.is_in_group("fuel"):
				# PULL TOWARDS FUEL (New Feature)
				thrust_force = dir * GameConfig.THRUST_POWER
			else:
				# PUSH AWAY FROM PLANET
				thrust_force = -dir * GameConfig.THRUST_POWER
		else:
			# Fallback if no nearest object in range?
			# Just use current velocity direction or Up
			thrust_force = Vector2(0, -1).rotated(rotation) * GameConfig.THRUST_POWER

	else:
		is_thrusting = false

	# Apply Forces
	velocity += (gravity_force + thrust_force) * delta

	# Rotate based on velocity (Visual)
	if velocity.length_squared() > 1.0:
		rotation = velocity.angle() + PI/2 # +90 deg offset because sprite points Up

	move_and_slide()

	# Check bounds (fallen below start with buffer)
	if global_position.y > 500:
		die()

	# Update Altitude Score
	var alt = floor(-global_position.y / 100.0)
	if alt > Global.score:
		Global.score = alt

	queue_redraw()

func land(planet):
	is_landed = true
	landed_planet = planet
	velocity = Vector2.ZERO

	# Rotate so butt points to planet (Nose points Outwards)
	var angle_out = (global_position - planet.global_position).angle()
	rotation = angle_out + PI/2

	# Snap to surface
	var dir = (global_position - planet.global_position).normalized()
	global_position = planet.global_position + dir * (planet.radius + GameConfig.SHIP_COLLISION_RADIUS)

	# Refuel slightly? (Optional, matches Web logic)
	if max_fuel != INF:
		add_fuel(5.0)

func _draw():
	# Simple triangle ship
	var color = Color.WHITE
	# Points relative to center (0,0). Nose points UP (-Y)
	var points = PackedVector2Array([
		Vector2(0, -15), # Nose
		Vector2(-10, 10), # Left Wing
		Vector2(0, 5),   # Engine indent
		Vector2(10, 10)   # Right Wing
	])
	draw_colored_polygon(points, color)

	# Thrust flame
	if is_thrusting and fuel > 0:
		var flame_color = Color.ORANGE
		var flame_points = PackedVector2Array([
			Vector2(-5, 5),
			Vector2(0, 20 + randf() * 10),
			Vector2(5, 5)
		])
		draw_colored_polygon(flame_points, flame_color)

func eject():
	if has_ejected: return
	has_ejected = true
	# Impulse away from nearest planet
	var planets = get_tree().get_nodes_in_group("planets")
	var nearest = null
	var min_dist = INF

	for p in planets:
		var dist = global_position.distance_to(p.global_position)
		if dist < min_dist:
			min_dist = dist
			nearest = p

	if nearest:
		var dir = (global_position - nearest.global_position).normalized()
		velocity += dir * 400.0
	else:
		velocity += Vector2.UP * 400.0

func add_fuel(amount: float):
	if max_fuel == INF: return

	var old_fuel = fuel
	fuel = min(max_fuel, fuel + amount)

	if fuel > old_fuel:
		fuel_gained.emit()

func die():
	if Global.is_game_over: return
	Global.is_game_over = true
	game_over.emit()
