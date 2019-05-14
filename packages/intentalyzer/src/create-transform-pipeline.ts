import { default as debug } from "debug";
import { IIntentTransform } from "./core-types";
import { BasicEntity, Entity } from "./entities";

const pipelineDebugLogger = debug("intentalyzer:transforms:pipeline");

export function createTransformPipeline<
    TConversationContext,
    TEntity extends Entity,
    TTransformedEntity1 extends Entity,
    TTransformedEntity2 extends Entity>(
    ...transforms: [
        IIntentTransform<TConversationContext, TEntity, TTransformedEntity1>,
        IIntentTransform<TConversationContext, TTransformedEntity1, TTransformedEntity2>,
    ])
    : IIntentTransform<TConversationContext, TEntity, TEntity|TTransformedEntity2>;

export function createTransformPipeline<
    TConversationContext,
    TEntity extends Entity,
    TTransformedEntity1 extends Entity,
    TTransformedEntity2 extends Entity,
    TTransformedEntity3 extends Entity>(
    ...transforms: [
        IIntentTransform<TConversationContext, TEntity, TTransformedEntity1>,
        IIntentTransform<TConversationContext, TTransformedEntity1, TTransformedEntity2>,
        IIntentTransform<TConversationContext, TTransformedEntity2, TTransformedEntity3>,
    ]): IIntentTransform<TConversationContext, TEntity, TEntity|TTransformedEntity3>;

export function createTransformPipeline<
    TConversationContext,
    TEntity extends Entity,
    TTransformedEntity1 extends Entity,
    TTransformedEntity2 extends Entity,
    TTransformedEntity3 extends Entity,
    TTransformedEntity4 extends Entity>(
    ...transforms: [
        IIntentTransform<TConversationContext, TEntity, TTransformedEntity1>,
        IIntentTransform<TConversationContext, TTransformedEntity1, TTransformedEntity2>,
        IIntentTransform<TConversationContext, TTransformedEntity2, TTransformedEntity3>,
        IIntentTransform<TConversationContext, TTransformedEntity3, TTransformedEntity4>,
    ]): IIntentTransform<TConversationContext, TEntity, TEntity|TTransformedEntity4>;

export function createTransformPipeline<
    TConversationContext,
    TEntity extends Entity,
    TTransformedEntity1 extends Entity,
    TTransformedEntity2 extends Entity,
    TTransformedEntity3 extends Entity,
    TTransformedEntity4 extends Entity,
    TTransformedEntity5 extends Entity>(
    ...transforms: [
        IIntentTransform<TConversationContext, TEntity, TTransformedEntity1>,
        IIntentTransform<TConversationContext, TTransformedEntity1|TEntity, TTransformedEntity2>,
        IIntentTransform<TConversationContext, TTransformedEntity2, TTransformedEntity3>,
        IIntentTransform<TConversationContext, TTransformedEntity3, TTransformedEntity4>,
        IIntentTransform<TConversationContext, TTransformedEntity4, TTransformedEntity5>,
    ]): IIntentTransform<TConversationContext, TEntity, TEntity|TTransformedEntity4>;

export function createTransformPipeline<TConversationContext, TEntity extends Entity = BasicEntity>(
    transforms: Array<IIntentTransform<TConversationContext, TEntity, TEntity>>,
): IIntentTransform<TConversationContext, TEntity, TEntity>;

/** Creates a pipeline of transforms which will be executed in the order supplied. */
export function createTransformPipeline<TConversationContext, TEntity extends Entity = BasicEntity>(
    transforms: any,
): IIntentTransform<TConversationContext, TEntity, TEntity> {
    const normalizedtransformerParams = Array.isArray(transforms) ? transforms : arguments;

    pipelineDebugLogger("Creating transform pipeline out of %i recognizers...", normalizedtransformerParams.length);

    return {
        apply: async (c, ri) => {
            pipelineDebugLogger("Transform pipeline running on recognized intent: %o", ri);

            let result = ri;

            for (const e of normalizedtransformerParams) {
                result = await e.apply(c, result);

                pipelineDebugLogger("Transformed: %o", result);
            }

            pipelineDebugLogger("Final transformed intent: %o", result);

            return result;
        },
    };
}
