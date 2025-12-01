/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1687431684")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != \"\" && user = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1687431684")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != \"\" && user.id = @request.auth.id &&\n(@request.body.user:id = \"\" || @request.body.user:id = @request.auth.id)"
  }, collection)

  return app.save(collection)
})
