/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1687431684")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id != \"\" && user.id = @request.auth.id",
    "listRule": "@request.auth.id != \"\" && user.id = @request.auth.id",
    "updateRule": "@request.auth.id != \"\" && user.id = @request.auth.id &&\n(@request.body.user:id = \"\" || @request.body.user:id = @request.auth.id)",
    "viewRule": "@request.auth.id != \"\" && user.id = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1687431684")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id = user",
    "listRule": "@request.auth.id = user",
    "updateRule": "@request.auth.id = user && (@request.body.user = \"\" || @request.body.user = user)",
    "viewRule": "@request.auth.id = user"
  }, collection)

  return app.save(collection)
})
