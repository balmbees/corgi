import { ClassValidator } from "../route_factories/presenter_route/class_validator";

export class TestAliasEntity {
  @ClassValidator.IsString()
  public aliasName: string;
}

export class TestStatEntity {
  @ClassValidator.IsNumber()
  public count: number;
}

export class TestEntity {
  @ClassValidator.IsNumber()
  public id: string;

  @ClassValidator.IsString()
  @ClassValidator.Validate(ClassValidator.IsNullable)
  public name: string | null;

  @ClassValidator.IsOptional()
  @ClassValidator.ValidateNested()
  public alias: TestAliasEntity;

  @ClassValidator.IsOptional()
  @ClassValidator.Validate(ClassValidator.ValidateEntityArray, [TestStatEntity])
  public stats: TestStatEntity[];
}
