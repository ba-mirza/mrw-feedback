def test_create_point_returns_survey_url(create_point):
    point = create_point(store="  ТРЦ Dostyk  ", register_number="3")
    assert point["store"] == "ТРЦ Dostyk"
    assert point["is_active"] is True
    assert len(point["code"]) == 10
    assert point["survey_url"] == f"https://survey.example/s/{point['code']}"


def test_duplicate_register_in_store_conflicts(client, auth_headers, create_point):
    create_point(store="ТРЦ Mega", register_number="1")
    response = client.post(
        "/v1/admin/points",
        json={"region": "Алматы", "store": "ТРЦ Mega", "register_number": "1"},
        headers=auth_headers,
    )
    assert response.status_code == 409
    assert response.json()["code"] == "point_exists"


def test_update_keeps_code(client, auth_headers, create_point):
    point = create_point()
    response = client.put(
        f"/v1/admin/points/{point['id']}",
        json={"region": "Астана", "store": "Keruen", "register_number": "2", "is_active": False},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["code"] == point["code"]
    assert (body["region"], body["store"], body["register_number"], body["is_active"]) == ("Астана", "Keruen", "2", False)


def test_list_is_sorted(client, auth_headers, create_point):
    create_point(region="Астана", store="Keruen", register_number="1")
    create_point(region="Алматы", store="Mega", register_number="2")
    create_point(region="Алматы", store="Mega", register_number="1")
    items = client.get("/v1/admin/points", headers=auth_headers).json()["items"]
    assert [(item["region"], item["register_number"]) for item in items] == [("Алматы", "1"), ("Алматы", "2"), ("Астана", "1")]


def test_qr_svg_and_png(client, auth_headers, create_point):
    point = create_point()
    svg = client.get(f"/v1/admin/points/{point['id']}/qr", headers=auth_headers)
    assert svg.status_code == 200
    assert svg.headers["content-type"].startswith("image/svg+xml")
    assert b"<svg" in svg.content

    png = client.get(f"/v1/admin/points/{point['id']}/qr?format=png", headers=auth_headers)
    assert png.headers["content-type"] == "image/png"
    assert png.content.startswith(b"\x89PNG")


def test_unknown_point_is_404(client, auth_headers):
    response = client.get("/v1/admin/points/999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["code"] == "point_not_found"
